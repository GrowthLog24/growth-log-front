/**
 * 명찰 생성용 자산 준비 스크립트
 *
 * `public/admin/name-badge/` 아래에 브라우저가 내려받을 자산을 만들어 둡니다.
 * 만들어지는 파일은 모두 다른 원본에서 파생되는 값이라 저장소에 커밋하지 않고
 * (`.gitignore` 참고) `predev`/`prebuild`에서 매번 새로 만듭니다.
 *
 * 1. `template.pdf`
 *    디자인 원본에서 예시 회원 정보("홍길동" / "PROJECT MANAGER")만 걷어낸 빈 명찰.
 *    원본 페이지의 콘텐츠 스트림에서 텍스트는 단 하나의 `BT ... ET` 블록에 모여
 *    있고, 나머지 문구("GROWTH LOG", "일정 안내" 등)는 모두 아웃라인 벡터라
 *    이 블록만 지우면 그대로 빈 템플릿이 됩니다.
 *
 * 2. `fonts/Pretendard-Bold.ttf`
 *    이름을 그릴 때 쓰는 폰트. 디자인 원본이 Pretendard 가변 폰트의 Bold(wght 700)
 *    인스턴스를 쓰므로 같은 굵기의 정적 파일을 가져옵니다. `pretendard` 패키지에
 *    들어 있는 파일이라 저장소에 사본을 두지 않고 `node_modules`에서 복사해 옵니다.
 *
 * 직무용 `fonts/Montserrat-Medium.ttf`와 캐러셀 미리보기 `preview.png`는 이 저장소
 * 밖에서 가져온 원본이라 커밋해 둡니다. 디자인이 바뀌면 `preview.png`는 새로 만든
 * 명찰에서 앞면을 잘라 직접 갱신해야 합니다.
 *
 * 실행:
 *   npm run build:name-badge-assets
 *
 * 빌드 과정에서 매번 도는 스크립트라 Node 버전을 타지 않도록 타입 없는
 * JavaScript로 둡니다. (`--experimental-strip-types`는 Node 22.6+ 필요)
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import {
  PDFArray,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFRef,
  decodePDFRawStream,
} from "pdf-lib";

/** 디자인 원본 PDF 경로 (프로젝트 루트 기준) */
const SOURCE_PDF = "resources/name-badge/[GL] 그로스로그 회원 명찰 (5기).pdf";

/** 자산을 만들어 둘 디렉터리 (프로젝트 루트 기준) */
const OUTPUT_DIR = "public/admin/name-badge";

/** `pretendard` 패키지 안의 이름용 폰트 경로 */
const PRETENDARD_FONT = "dist/public/static/alternative/Pretendard-Bold.ttf";

/** 예시 텍스트 블록 패턴 (콘텐츠 스트림의 유일한 텍스트 블록) */
const TEXT_BLOCK_PATTERN = /BT[\s\S]*?ET/g;

/**
 * 첫 페이지 콘텐츠 스트림의 참조를 찾습니다.
 *
 * 원본은 스트림이 하나뿐이지만, 배열로 들어오는 PDF도 있어 두 형태를 모두
 * 처리합니다.
 *
 * @param {PDFDocument} pdfDoc - 원본 문서
 * @returns {PDFRef} 첫 페이지 콘텐츠 스트림의 참조
 * @throws {Error} 참조를 찾지 못한 경우
 */
function findContentsRef(pdfDoc) {
  const contents = pdfDoc.getPage(0).node.get(PDFName.of("Contents"));

  if (contents instanceof PDFRef) {
    return contents;
  }
  if (contents instanceof PDFArray && contents.size() === 1) {
    const first = contents.get(0);
    if (first instanceof PDFRef) {
      return first;
    }
  }
  throw new Error("첫 페이지에서 콘텐츠 스트림 참조를 찾지 못했습니다.");
}

/**
 * 콘텐츠 스트림을 문자열로 디코딩합니다.
 *
 * PDF 콘텐츠는 대부분 Flate 압축이라 바로 문자열로 읽을 수 없습니다.
 * 텍스트 외 바이트를 손상 없이 되돌려야 하므로 latin1로 다룹니다.
 *
 * @param {PDFRawStream} stream - 콘텐츠 스트림
 * @returns {string} 디코딩된 콘텐츠 스트림
 */
function decodeContents(stream) {
  return Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1");
}

/**
 * 디자인 원본에서 예시 텍스트를 걷어낸 빈 템플릿을 만듭니다.
 *
 * @param {string} root - 프로젝트 루트 경로
 * @returns {Promise<void>}
 * @throws {Error} 원본 구조가 예상과 다른 경우
 */
async function buildTemplate(root) {
  const pdfDoc = await PDFDocument.load(
    await readFile(path.join(root, SOURCE_PDF))
  );

  const contentsRef = findContentsRef(pdfDoc);
  const stream = pdfDoc.context.lookup(contentsRef);
  if (!(stream instanceof PDFRawStream)) {
    throw new Error("콘텐츠 스트림을 읽지 못했습니다.");
  }

  const contents = decodeContents(stream);
  const blocks = contents.match(TEXT_BLOCK_PATTERN) ?? [];
  if (blocks.length !== 1) {
    throw new Error(
      `텍스트 블록이 1개일 것으로 기대했지만 ${blocks.length}개를 찾았습니다. ` +
        "원본 디자인이 바뀌었다면 이 스크립트도 함께 손봐야 합니다."
    );
  }

  const stripped = contents.replace(TEXT_BLOCK_PATTERN, "");
  pdfDoc.context.assign(
    contentsRef,
    pdfDoc.context.flateStream(Buffer.from(stripped, "latin1"))
  );

  const output = path.join(root, OUTPUT_DIR, "template.pdf");
  await writeFile(output, await pdfDoc.save());
  console.log(`  template.pdf (제거한 텍스트 블록 ${blocks.length}개)`);
}

/**
 * 이름용 폰트를 `pretendard` 패키지에서 복사해 옵니다.
 *
 * @param {string} root - 프로젝트 루트 경로
 * @returns {Promise<void>}
 */
async function copyNameFont(root) {
  const require = createRequire(path.join(root, "package.json"));
  const packageRoot = path.dirname(require.resolve("pretendard/package.json"));
  const target = path.join(root, OUTPUT_DIR, "fonts", "Pretendard-Bold.ttf");

  await copyFile(path.join(packageRoot, PRETENDARD_FONT), target);
  console.log("  fonts/Pretendard-Bold.ttf (pretendard 패키지에서 복사)");
}

async function main() {
  const root = process.cwd();
  await mkdir(path.join(root, OUTPUT_DIR, "fonts"), { recursive: true });

  console.log(`명찰 자산 생성 → ${OUTPUT_DIR}`);
  await buildTemplate(root);
  await copyNameFont(root);
}

await main();
