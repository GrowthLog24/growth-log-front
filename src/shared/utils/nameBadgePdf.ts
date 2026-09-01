import QRCode from "qrcode";
import type { Font as OutlineFont, Path as GlyphPath } from "@pdf-lib/fontkit";
import type { PDFPage } from "pdf-lib";
import { buildMemberAchievementUrl } from "@/shared/utils/memberLink";

/**
 * 명찰 한 장에 필요한 회원 정보
 *
 * `Member` 엔티티 전체가 아니라 명찰에 실제로 찍히는 값만 받습니다.
 */
export interface NameBadgeMember {
  /** 회원 이름 (명찰 이름 자리) */
  memberName: string;
  /** 가입 기수 (QR이 가리킬 업적 페이지 주소에 사용) */
  generation: number;
  /** 기술 분야 (명찰 직무 자리, 없으면 직무를 비웁니다) */
  field?: string;
}

/**
 * 명찰 생성에 필요한 정적 자산 (템플릿 PDF, 폰트)
 */
export interface NameBadgeAssets {
  /** 예시 텍스트를 걷어낸 템플릿 PDF */
  templateBytes: ArrayBuffer;
  /** 이름용 폰트 (Pretendard Bold) */
  nameFontBytes: ArrayBuffer;
  /** 직무용 폰트 (Montserrat Medium) */
  roleFontBytes: ArrayBuffer;
}

/**
 * 명찰 자산 경로 (`public/` 기준)
 *
 * 템플릿은 `scripts/build-name-badge-template.mts`가 디자인 원본에서 만들어 둡니다.
 */
export const NAME_BADGE_ASSET_PATHS = {
  template: "/admin/name-badge/template.pdf",
  nameFont: "/admin/name-badge/fonts/Pretendard-Bold.ttf",
  roleFont: "/admin/name-badge/fonts/Montserrat-Medium.ttf",
} as const;

/** A4 한 장에 들어가는 명찰 수 (좌/우 2명) */
export const BADGES_PER_SHEET = 2;

/**
 * 명찰 슬롯별 좌표 (PDF 좌표계, 원점은 좌하단 / 단위 pt)
 *
 * 디자인 원본에서 실측한 값입니다. 이름·직무는 카드 중심에, QR은 앞면
 * 사각 박스 중심에 맞춰져 있어 기준 x가 미세하게 다릅니다.
 */
const BADGE_SLOTS = [
  { textCenterX: 157.5, qrCenterX: 157.344 },
  { textCenterX: 438.5, qrCenterX: 438.167 },
] as const;

/** 이름 텍스트 배치 값 (원본과 동일) */
const NAME_TEXT = {
  baselineY: 285.1992,
  fontSize: 50.8112,
  /** 원본 자간(Tc). 글자 크기에 비례하는 비율 값입니다. */
  charSpacingRatio: 0.225,
} as const;

/** 직무 텍스트 배치 값 (원본과 동일) */
const ROLE_TEXT = {
  baselineY: 253.9844,
  fontSize: 14.9949,
} as const;

/**
 * QR 배치 값
 *
 * 앞면 사각 박스(80.69pt) 중앙에 넣습니다. 박스의 남는 여백이 QR 정숙 영역
 * (quiet zone) 역할을 하므로 QR 자체에는 여백을 두지 않습니다.
 *
 * 크기는 박스에 처음 맞췄던 62pt에서 10% 줄인 값입니다. 가운데 정렬이라
 * 줄어든 만큼 사방 여백이 함께 늘어납니다.
 */
const QR_PLACEMENT = {
  centerY: 184.596,
  size: 55.8,
} as const;

/**
 * 텍스트가 넘지 않아야 하는 폭 (pt)
 *
 * 명찰 카드 폭 269pt에서 좌우 16pt씩을 여백으로 남긴 값입니다. 이름이 길어
 * 이 폭을 넘으면 글자 크기를 비례해서 줄입니다.
 */
const MAX_TEXT_WIDTH = 237;

/**
 * 기술 분야를 명찰 직무 표기로 바꿉니다.
 *
 * 원본 디자인이 대문자 표기(PROJECT MANAGER)이므로 맞춰서 올립니다.
 *
 * @param {string} [field] - 회원의 기술 분야
 * @returns {string} 직무 텍스트 (없으면 빈 문자열)
 */
export function toBadgeRoleText(field?: string): string {
  return (field ?? "").trim().toUpperCase();
}

/**
 * 텍스트를 직무용 폰트(Montserrat)로 그릴 수 있는지 판정합니다.
 *
 * Montserrat에는 한글 글리프가 없어서, 기술 분야에 한글이 들어간 경우
 * 이름용 폰트(Pretendard)로 대체해야 글자가 깨지지 않습니다.
 *
 * @param {string} text - 그릴 텍스트
 * @returns {boolean} 라틴 문자 범위로만 이루어져 있으면 true
 */
function isLatinOnly(text: string): boolean {
  for (const char of text) {
    if (char.codePointAt(0)! > 0x024f) {
      return false;
    }
  }
  return true;
}

/**
 * 크기를 조절할 수 있는 글리프 패스
 *
 * fontkit의 Path는 실제로 `scale`을 제공하지만 함께 배포되는 타입 정의에는
 * 빠져 있어(`@pdf-lib/fontkit/fontkit.d.ts`) 여기서 보충합니다.
 */
interface ScalablePath extends GlyphPath {
  scale(scaleX: number, scaleY: number): ScalablePath;
}

/** 가운데 정렬 텍스트를 그릴 때 필요한 값 */
interface OutlinedTextOptions {
  /** 그릴 문자열 */
  text: string;
  /** 글리프 아웃라인을 꺼낼 폰트 */
  font: OutlineFont;
  /** 글자 크기 (pt) */
  fontSize: number;
  /** 가운데 정렬 기준 x (pt) */
  centerX: number;
  /** 기준선 y (pt) */
  baselineY: number;
  /** 자간 (pt) */
  charSpacing: number;
}

/**
 * 텍스트를 글리프 아웃라인(벡터 패스)으로 그립니다.
 *
 * 폰트를 PDF에 심는 대신 글자 모양을 그대로 패스로 그립니다. 템플릿의 다른
 * 문구("GROWTH LOG", "일정 안내" 등)도 모두 아웃라인이라 표현 방식이 같아지고,
 * 인쇄소에서 폰트 누락으로 글자가 바뀔 여지도 없습니다.
 *
 * @param {PDFPage} page - 그릴 페이지
 * @param {OutlinedTextOptions} options - 텍스트 배치 값
 * @param {typeof import("pdf-lib")} pdfLib - 동적으로 불러온 pdf-lib 모듈
 */
function drawOutlinedText(
  page: PDFPage,
  options: OutlinedTextOptions,
  pdfLib: typeof import("pdf-lib")
): void {
  const { text, font, centerX, baselineY } = options;
  if (!text) return;

  const run = font.layout(text);
  // 자간은 글자 사이에만 들어갑니다. (원본 디자인의 가운데 정렬 규칙)
  const gaps = Math.max(0, run.glyphs.length - 1);

  const naturalWidth =
    (run.advanceWidth * options.fontSize) / font.unitsPerEm +
    options.charSpacing * gaps;

  // 이름이 길어 카드를 넘치면 글자 크기와 자간을 함께 비례 축소합니다.
  // 폭이 글자 크기에 비례하므로 한 번의 계산으로 정확히 맞습니다.
  const shrinkRatio =
    naturalWidth > MAX_TEXT_WIDTH ? MAX_TEXT_WIDTH / naturalWidth : 1;
  const fontSize = options.fontSize * shrinkRatio;
  const charSpacing = options.charSpacing * shrinkRatio;

  // 폰트 좌표(units per em)를 pt로 바꾸는 비율
  const unitScale = fontSize / font.unitsPerEm;
  const totalWidth = naturalWidth * shrinkRatio;

  let penX = centerX - totalWidth / 2;
  for (let index = 0; index < run.glyphs.length; index += 1) {
    const glyph = run.glyphs[index];
    const position = run.positions[index];

    // pdf-lib의 drawSvgPath는 SVG 규약대로 y축을 뒤집으므로,
    // 미리 y를 뒤집어 두면 최종적으로 폰트 좌표계(위쪽이 +) 그대로 그려집니다.
    const outline = (glyph.path as ScalablePath).scale(unitScale, -unitScale);
    const pathData = outline.toSVG();
    if (pathData) {
      page.drawSvgPath(pathData, {
        x: penX + position.xOffset * unitScale,
        y: baselineY + position.yOffset * unitScale,
        color: pdfLib.rgb(0, 0, 0),
      });
    }

    penX += position.xAdvance * unitScale + charSpacing;
  }
}

/**
 * QR 코드를 벡터 패스로 만듭니다.
 *
 * 한 줄에서 이어지는 검은 모듈을 하나의 사각형으로 묶어 패스를 줄입니다.
 * 좌표는 좌상단이 원점인 SVG 규약을 따르며, `drawSvgPath`가 y축을 뒤집어
 * 그려 주므로 PDF에서는 QR의 좌상단을 기준점으로 넘기면 됩니다.
 *
 * @param {string} url - QR에 담을 주소
 * @param {number} size - QR 한 변의 길이 (pt)
 * @returns {string} SVG path 데이터
 */
function createQrPathData(url: string, size: number): string {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
  const moduleSize = size / modules.size;
  const parts: string[] = [];

  for (let row = 0; row < modules.size; row += 1) {
    let column = 0;
    while (column < modules.size) {
      if (!modules.data[row * modules.size + column]) {
        column += 1;
        continue;
      }

      // 이어지는 검은 모듈을 한 덩어리로 묶습니다.
      let runLength = 1;
      while (
        column + runLength < modules.size &&
        modules.data[row * modules.size + column + runLength]
      ) {
        runLength += 1;
      }

      const x = column * moduleSize;
      const y = row * moduleSize;
      const width = runLength * moduleSize;
      parts.push(
        `M${x.toFixed(3)} ${y.toFixed(3)}h${width.toFixed(3)}v${moduleSize.toFixed(3)}h-${width.toFixed(3)}Z`
      );
      column += runLength;
    }
  }

  return parts.join("");
}

/** 명찰 한 칸을 채울 때 필요한 값 */
interface BadgeSlotContent {
  /** 대상 회원 */
  member: NameBadgeMember;
  /** 이름용 폰트 */
  nameFont: OutlineFont;
  /** 직무용 폰트 */
  roleFont: OutlineFont;
}

/**
 * 명찰 한 칸(좌 또는 우)에 이름·직무·QR을 그립니다.
 *
 * @param {PDFPage} page - 대상 페이지
 * @param {number} slotIndex - 슬롯 번호 (0: 왼쪽, 1: 오른쪽)
 * @param {BadgeSlotContent} content - 채울 내용
 * @param {typeof import("pdf-lib")} pdfLib - 동적으로 불러온 pdf-lib 모듈
 */
function drawBadgeSlot(
  page: PDFPage,
  slotIndex: number,
  content: BadgeSlotContent,
  pdfLib: typeof import("pdf-lib")
): void {
  const slot = BADGE_SLOTS[slotIndex];
  const { member, nameFont, roleFont } = content;

  drawOutlinedText(
    page,
    {
      text: member.memberName.trim(),
      font: nameFont,
      fontSize: NAME_TEXT.fontSize,
      centerX: slot.textCenterX,
      baselineY: NAME_TEXT.baselineY,
      charSpacing: NAME_TEXT.fontSize * NAME_TEXT.charSpacingRatio,
    },
    pdfLib
  );

  const roleText = toBadgeRoleText(member.field);
  drawOutlinedText(
    page,
    {
      text: roleText,
      font: isLatinOnly(roleText) ? roleFont : nameFont,
      fontSize: ROLE_TEXT.fontSize,
      centerX: slot.textCenterX,
      baselineY: ROLE_TEXT.baselineY,
      charSpacing: 0,
    },
    pdfLib
  );

  const qrUrl = buildMemberAchievementUrl(member.generation, member.memberName);
  page.drawSvgPath(createQrPathData(qrUrl, QR_PLACEMENT.size), {
    x: slot.qrCenterX - QR_PLACEMENT.size / 2,
    y: QR_PLACEMENT.centerY + QR_PLACEMENT.size / 2,
    color: pdfLib.rgb(0, 0, 0),
  });
}

/**
 * 회원 목록으로 명찰 PDF를 만듭니다.
 *
 * A4 한 장에 명찰 2개가 들어가므로 회원을 두 명씩 묶어 페이지를 만듭니다.
 * 홀수 인원이면 마지막 장의 오른쪽은 빈 명찰로 남습니다.
 *
 * @param {readonly NameBadgeMember[]} members - 명찰을 만들 회원 목록
 * @param {NameBadgeAssets} assets - 템플릿 PDF와 폰트 바이트
 * @returns {Promise<Uint8Array>} 완성된 PDF 바이트
 * @throws {Error} 회원 목록이 비어 있는 경우
 */
export async function createNameBadgePdf(
  members: readonly NameBadgeMember[],
  assets: NameBadgeAssets
): Promise<Uint8Array> {
  if (members.length === 0) {
    throw new Error("명찰을 만들 회원을 한 명 이상 선택해주세요.");
  }

  // 번들 크기가 큰 라이브러리라 이 기능을 실제로 쓸 때만 불러옵니다.
  const [pdfLib, fontkitModule] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
  ]);
  const fontkit = fontkitModule.default;

  const nameFont = fontkit.create(new Uint8Array(assets.nameFontBytes));
  const roleFont = fontkit.create(new Uint8Array(assets.roleFontBytes));

  const templateDoc = await pdfLib.PDFDocument.load(assets.templateBytes);
  const outputDoc = await pdfLib.PDFDocument.create();

  const sheetCount = Math.ceil(members.length / BADGES_PER_SHEET);
  // 한 번의 copyPages 호출 안에서는 템플릿 리소스가 재사용되므로,
  // 페이지마다 따로 복사하지 않고 필요한 장수를 한꺼번에 복사합니다.
  const pages = await outputDoc.copyPages(
    templateDoc,
    new Array(sheetCount).fill(0)
  );
  for (const page of pages) {
    outputDoc.addPage(page);
  }

  for (let index = 0; index < members.length; index += 1) {
    drawBadgeSlot(
      pages[Math.floor(index / BADGES_PER_SHEET)],
      index % BADGES_PER_SHEET,
      { member: members[index], nameFont, roleFont },
      pdfLib
    );
  }

  return outputDoc.save();
}

/**
 * 명찰 생성에 필요한 정적 자산을 내려받습니다.
 *
 * @returns {Promise<NameBadgeAssets>} 템플릿 PDF와 폰트 바이트
 * @throws {Error} 자산을 내려받지 못한 경우
 */
export async function fetchNameBadgeAssets(): Promise<NameBadgeAssets> {
  const fetchBytes = async (path: string): Promise<ArrayBuffer> => {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`명찰 자산을 불러오지 못했습니다: ${path}`);
    }
    return response.arrayBuffer();
  };

  const [templateBytes, nameFontBytes, roleFontBytes] = await Promise.all([
    fetchBytes(NAME_BADGE_ASSET_PATHS.template),
    fetchBytes(NAME_BADGE_ASSET_PATHS.nameFont),
    fetchBytes(NAME_BADGE_ASSET_PATHS.roleFont),
  ]);

  return { templateBytes, nameFontBytes, roleFontBytes };
}

/**
 * 명찰 PDF 파일 이름을 만듭니다.
 *
 * @param {number} memberCount - 명찰을 만든 회원 수
 * @param {Date} [now] - 기준 시각 (기본값: 현재)
 * @returns {string} `그로스로그-명찰-12명-20260901.pdf` 형태의 파일 이름
 */
export function buildNameBadgeFileName(
  memberCount: number,
  now: Date = new Date()
): string {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  return `그로스로그-명찰-${memberCount}명-${stamp}.pdf`;
}

/**
 * 명찰 PDF를 만들어 바로 내려받습니다.
 *
 * @param {readonly NameBadgeMember[]} members - 명찰을 만들 회원 목록
 * @returns {Promise<void>}
 * @throws {Error} 자산을 못 불러오거나 회원 목록이 비어 있는 경우
 */
export async function downloadNameBadgePdf(
  members: readonly NameBadgeMember[]
): Promise<void> {
  const assets = await fetchNameBadgeAssets();
  const bytes = await createNameBadgePdf(members, assets);
  const objectUrl = URL.createObjectURL(
    new Blob([bytes as BlobPart], { type: "application/pdf" })
  );

  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = buildNameBadgeFileName(members.length);
    link.click();
  } finally {
    // 다운로드가 시작된 뒤에 해제해야 하므로 다음 이벤트 루프로 미룹니다.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}
