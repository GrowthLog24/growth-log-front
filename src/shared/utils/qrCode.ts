import QRCode from "qrcode";

/** QR 이미지 기본 크기 (px) - 대형 인쇄물에서도 쓸 수 있게 넉넉히 잡습니다. */
const DEFAULT_QR_SIZE = 1024;

/** QR 공통 렌더링 옵션 */
const QR_RENDER_OPTIONS = {
  width: DEFAULT_QR_SIZE,
  margin: 2,
  color: { dark: "#000000", light: "#ffffff" },
} as const;

/**
 * 주소를 담은 QR 코드를 PNG DataURL로 만듭니다.
 *
 * @param {string} url - QR에 담을 주소
 * @returns {Promise<string>} `data:image/png;base64,...` 형태의 문자열
 */
export function createQrPngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, QR_RENDER_OPTIONS);
}

/**
 * 주소를 담은 QR 코드를 SVG 문자열로 만듭니다.
 *
 * 현수막·포스터처럼 크게 인쇄하는 홍보물에서 확대해도 깨지지 않도록
 * 벡터 형식을 함께 제공합니다.
 *
 * @param {string} url - QR에 담을 주소
 * @returns {Promise<string>} SVG 마크업
 */
export function createQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...QR_RENDER_OPTIONS, type: "svg" });
}

/**
 * 파일 이름으로 쓸 수 없는 문자를 제거합니다.
 *
 * @param {string} name - 원본 이름
 * @returns {string} 파일 이름으로 안전한 문자열
 */
function toSafeFileName(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]/g, "_") || "qr";
}

/**
 * 브라우저에서 주어진 주소의 파일을 내려받습니다.
 *
 * @param {string} href - DataURL 또는 Object URL
 * @param {string} fileName - 저장될 파일 이름
 */
function triggerDownload(href: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.click();
}

/**
 * QR 코드를 PNG 파일로 내려받습니다.
 *
 * @param {string} url - QR에 담긴 주소
 * @param {string} fileName - 확장자를 제외한 파일 이름
 */
export async function downloadQrPng(
  url: string,
  fileName: string
): Promise<void> {
  const dataUrl = await createQrPngDataUrl(url);
  triggerDownload(dataUrl, `${toSafeFileName(fileName)}.png`);
}

/**
 * QR 코드를 SVG 파일로 내려받습니다.
 *
 * @param {string} url - QR에 담긴 주소
 * @param {string} fileName - 확장자를 제외한 파일 이름
 */
export async function downloadQrSvg(
  url: string,
  fileName: string
): Promise<void> {
  const svg = await createQrSvg(url);
  const objectUrl = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml" })
  );
  try {
    triggerDownload(objectUrl, `${toSafeFileName(fileName)}.svg`);
  } finally {
    // 다운로드가 시작된 뒤에 해제해야 하므로 다음 이벤트 루프로 미룹니다.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}
