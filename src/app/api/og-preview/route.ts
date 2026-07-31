import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { auth } from "@/auth";
import { IS_ADMIN_AUTH_BYPASSED } from "@/shared/constants/devAuth";

/** node:dns 사용을 위해 Node.js 런타임을 명시합니다. */
export const runtime = "nodejs";

/** HTML 본문 최대 수신 크기 */
const MAX_HTML_BYTES = 512 * 1024;
/** 썸네일 이미지 최대 수신 크기 */
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
/** 외부 요청 타임아웃 */
const FETCH_TIMEOUT_MS = 8_000;
/** 리다이렉트 최대 추적 횟수 */
const MAX_REDIRECTS = 3;

/**
 * OG 미리보기 응답
 */
interface OgPreview {
  title: string;
  description: string;
  /** 썸네일 data URI. 수집 실패 시 null */
  image: string | null;
  imageContentType: string | null;
}

/**
 * IPv4 주소가 사설/예약 대역인지 판별합니다.
 */
function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }
  const [a, b] = parts;

  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // 링크 로컬 (클라우드 메타데이터)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // 멀티캐스트 및 예약
  return false;
}

/**
 * IPv6 주소가 사설/예약 대역인지 판별합니다.
 */
function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80")) return true; // 링크 로컬

  // IPv4 매핑 주소(::ffff:10.0.0.1)는 IPv4 규칙으로 검사합니다.
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);

  return false;
}

/**
 * URL이 외부 공개 대상인지 검증합니다.
 *
 * 호스트명을 실제 IP로 해석한 뒤 사설 대역을 차단해
 * 내부망 요청(SSRF)을 방지합니다.
 *
 * @param {string} rawUrl - 검사할 URL 문자열
 * @returns {Promise<URL | null>} 안전하면 URL 객체, 아니면 null
 */
async function resolveSafeUrl(rawUrl: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  try {
    const addresses = await lookup(url.hostname, { all: true });
    if (addresses.length === 0) return null;

    for (const { address, family } of addresses) {
      const isPrivate =
        family === 4 ? isPrivateIpv4(address) : isPrivateIpv6(address);
      if (isPrivate) return null;
    }
  } catch {
    return null;
  }

  return url;
}

/**
 * 리다이렉트를 수동으로 추적하며 매 홉마다 대상 주소를 재검증합니다.
 *
 * 자동 추적(redirect: "follow")을 쓰면 공개 도메인이 내부 주소로
 * 리다이렉트하는 우회를 막을 수 없습니다.
 */
async function safeFetch(
  initialUrl: URL,
  accept: string
): Promise<Response | null> {
  let currentUrl: URL | null = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!currentUrl) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          // 일부 블로그가 기본 UA를 차단하므로 일반 브라우저 UA를 사용합니다.
          "User-Agent":
            "Mozilla/5.0 (compatible; GrowthLogBot/1.0; +https://growth-log.kr)",
          Accept: accept,
        },
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }

    const isRedirect = response.status >= 300 && response.status < 400;
    if (!isRedirect) {
      return response.ok ? response : null;
    }

    const location = response.headers.get("location");
    if (!location) return null;

    currentUrl = await resolveSafeUrl(new URL(location, currentUrl).toString());
  }

  return null;
}

/**
 * 크기 제한을 지키며 응답 본문을 읽습니다.
 */
async function readLimited(
  response: Response,
  maxBytes: number
): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/**
 * HTML에서 지정한 메타 속성 값을 추출합니다.
 */
function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return "";
}

/**
 * 자주 쓰이는 HTML 엔티티를 디코딩합니다.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * 블로그 URL의 OG 메타데이터를 수집합니다.
 *
 * 관리자 세션이 있어야 호출할 수 있으며,
 * 내부망 주소로의 요청은 차단됩니다.
 */
export async function POST(request: Request) {
  // 로컬 개발 우회가 켜져 있지 않으면 관리자 세션을 반드시 확인합니다.
  // 이 검사가 빠지면 임의 URL을 서버가 대신 요청하는 SSRF 프록시가 됩니다.
  if (!IS_ADMIN_AUTH_BYPASSED) {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "admin" && session.user.role !== "editor")
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
    }
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!body.url) {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  const safeUrl = await resolveSafeUrl(body.url);
  if (!safeUrl) {
    return NextResponse.json(
      { error: "허용되지 않는 주소입니다." },
      { status: 400 }
    );
  }

  const pageResponse = await safeFetch(safeUrl, "text/html,application/xhtml+xml");
  if (!pageResponse) {
    return NextResponse.json(
      { error: "페이지를 불러오지 못했습니다." },
      { status: 502 }
    );
  }

  const htmlBytes = await readLimited(pageResponse, MAX_HTML_BYTES);
  if (!htmlBytes) {
    return NextResponse.json(
      { error: "페이지 응답이 너무 큽니다." },
      { status: 502 }
    );
  }

  const html = new TextDecoder("utf-8").decode(htmlBytes);

  const title =
    extractMeta(html, "og:title") ||
    extractMeta(html, "twitter:title") ||
    decodeHtmlEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "");

  const description =
    extractMeta(html, "og:description") ||
    extractMeta(html, "twitter:description") ||
    extractMeta(html, "description");

  const imageUrl =
    extractMeta(html, "og:image") || extractMeta(html, "twitter:image");

  const preview: OgPreview = {
    title,
    description: description.slice(0, 200),
    image: null,
    imageContentType: null,
  };

  if (imageUrl) {
    const absoluteImageUrl = await resolveSafeUrl(
      new URL(imageUrl, pageResponse.url || safeUrl).toString()
    );

    if (absoluteImageUrl) {
      const imageResponse = await safeFetch(absoluteImageUrl, "image/*");
      const contentType = imageResponse?.headers.get("content-type") ?? "";

      if (imageResponse && contentType.startsWith("image/")) {
        const imageBytes = await readLimited(imageResponse, MAX_IMAGE_BYTES);
        if (imageBytes) {
          preview.image = `data:${contentType};base64,${Buffer.from(imageBytes).toString("base64")}`;
          preview.imageContentType = contentType;
        }
      }
    }
  }

  return NextResponse.json(preview);
}
