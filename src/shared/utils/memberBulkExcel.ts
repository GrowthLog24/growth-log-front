import * as XLSX from "xlsx";

/**
 * 멤버 일괄 등록/내보내기 엑셀 변환 유틸
 *
 * 양식 다운로드 · 현황 내보내기 · 업로드 파싱이 모두 이 파일의
 * 컬럼 정의를 공유하므로, 컬럼을 추가할 때는 여기만 수정하면 됩니다.
 */

/** 한 줄 소개 최대 길이 (회원 기본 정보 폼과 동일) */
export const BIO_MAX_LENGTH = 100;

/** 성장일지 요약 최대 길이 (회원 성장일지 패널과 동일) */
export const EXCERPT_MAX_LENGTH = 200;

/** 멤버 시트 이름 */
export const MEMBER_SHEET_NAME = "멤버 목록";

/** 성장일지 시트 이름 */
export const GROWTH_LOG_SHEET_NAME = "성장일지";

/** 작성 안내 시트 이름 */
const GUIDE_SHEET_NAME = "작성 안내";

/**
 * 멤버 시트 컬럼
 *
 * 앞 3개는 기존 양식과 동일한 헤더라서, 예전에 받아둔 파일도 그대로 읽힙니다.
 */
const MEMBER_COLUMNS = [
  "멤버 이름",
  "가입 기수",
  "가입 여부",
  "기술 분야",
  "한 줄 소개",
  "프로필 이미지 URL",
] as const;

/** 성장일지 시트 컬럼 */
const GROWTH_LOG_COLUMNS = [
  "멤버 이름",
  "가입 기수",
  "블로그 URL",
  "제목",
  "분야",
  "요약",
  "정기모임 회차",
  "썸네일 URL",
  "홈 노출",
] as const;

/** 멤버 시트 한 행 */
export interface MemberSheetRow {
  memberName: string;
  generation: number;
  isActive: boolean;
  field: string;
  bio: string;
  profileImageUrl: string;
}

/** 성장일지 시트 한 행 */
export interface GrowthLogSheetRow {
  memberName: string;
  generation: number;
  blogUrl: string;
  title: string;
  field: string;
  excerpt: string;
  /** 정기모임 회차 번호 (0이면 미지정) */
  round: number;
  thumbnailUrl: string;
  showOnHome: boolean;
}

/** 업로드한 워크북 파싱 결과 */
export interface ParsedMemberWorkbook {
  members: MemberSheetRow[];
  growthLogs: GrowthLogSheetRow[];
  /** 필수값이 비어 건너뛴 멤버 행 수 */
  skippedMemberRows: number;
  /** 필수값이 비어 건너뛴 성장일지 행 수 */
  skippedGrowthLogRows: number;
}

/** O/X 표기를 불리언으로 해석할 때 거짓으로 볼 값들 */
const FALSY_FLAGS = ["X", "N", "NO", "FALSE", "0", "미노출", "비활성"];

/**
 * O/X 형태의 셀 값을 불리언으로 변환합니다.
 *
 * @param value - 셀 원본 값
 * @param defaultValue - 셀이 비어 있을 때 사용할 값
 */
function parseFlag(value: unknown, defaultValue: boolean): boolean {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "") return defaultValue;
  return !FALSY_FLAGS.includes(normalized);
}

/** 불리언을 O/X 표기로 변환합니다. */
function formatFlag(value: boolean): "O" | "X" {
  return value ? "O" : "X";
}

/** 셀 값을 공백 제거한 문자열로 변환합니다. */
function toText(value: unknown): string {
  return String(value ?? "").trim();
}

/** 셀 값을 정수로 변환합니다. 숫자가 아니면 0을 반환합니다. */
function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 헤더와 데이터 행으로 워크시트를 만듭니다.
 *
 * json_to_sheet는 데이터가 비면 헤더까지 사라지므로,
 * 헤더를 항상 남기기 위해 배열 기반으로 생성합니다.
 */
function createSheet(
  header: readonly string[],
  rows: readonly unknown[][],
  columnWidths: readonly number[]
): XLSX.WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet([[...header], ...rows.map((row) => [...row])]);
  sheet["!cols"] = columnWidths.map((wch) => ({ wch }));
  return sheet;
}

/** 멤버 시트를 만듭니다. */
function createMemberSheet(rows: readonly MemberSheetRow[]): XLSX.WorkSheet {
  return createSheet(
    MEMBER_COLUMNS,
    rows.map((row) => [
      row.memberName,
      row.generation,
      formatFlag(row.isActive),
      row.field,
      row.bio,
      row.profileImageUrl,
    ]),
    [14, 10, 10, 16, 40, 44]
  );
}

/** 성장일지 시트를 만듭니다. */
function createGrowthLogSheet(rows: readonly GrowthLogSheetRow[]): XLSX.WorkSheet {
  return createSheet(
    GROWTH_LOG_COLUMNS,
    rows.map((row) => [
      row.memberName,
      row.generation,
      row.blogUrl,
      row.title,
      row.field,
      row.excerpt,
      row.round || "",
      row.thumbnailUrl,
      formatFlag(row.showOnHome),
    ]),
    [14, 10, 44, 32, 14, 50, 14, 44, 10]
  );
}

/** 작성 안내 시트를 만듭니다. */
function createGuideSheet(): XLSX.WorkSheet {
  const rows: string[][] = [
    ["시트", "컬럼", "필수", "설명"],
    [MEMBER_SHEET_NAME, "멤버 이름", "필수", "예: 홍길동"],
    [MEMBER_SHEET_NAME, "가입 기수", "필수", "숫자만 입력 (예: 5)"],
    [
      MEMBER_SHEET_NAME,
      "가입 여부",
      "선택",
      "O = 가입 / X = 미가입. 비우면 O로 처리됩니다.",
    ],
    [MEMBER_SHEET_NAME, "기술 분야", "선택", "예: Frontend, Backend, AI/ML"],
    [
      MEMBER_SHEET_NAME,
      "한 줄 소개",
      "선택",
      `업적 페이지 상단에 표시됩니다. ${BIO_MAX_LENGTH}자까지 저장됩니다.`,
    ],
    [
      MEMBER_SHEET_NAME,
      "프로필 이미지 URL",
      "선택",
      "이미지 파일 업로드는 지원하지 않습니다. 이미 올라간 이미지 주소만 입력하세요. 비워두면 기존 이미지가 유지됩니다.",
    ],
    [
      GROWTH_LOG_SHEET_NAME,
      "멤버 이름 / 가입 기수",
      "필수",
      "멤버 목록 시트의 값과 정확히 같아야 연결됩니다.",
    ],
    [GROWTH_LOG_SHEET_NAME, "블로그 URL", "필수", "같은 URL이 이미 있으면 덮어씁니다."],
    [GROWTH_LOG_SHEET_NAME, "제목", "필수", "블로그 글 제목"],
    [GROWTH_LOG_SHEET_NAME, "분야", "선택", "예: Frontend, Backend"],
    [
      GROWTH_LOG_SHEET_NAME,
      "요약",
      "선택",
      `카드에 표시될 미리보기 문구. ${EXCERPT_MAX_LENGTH}자까지 저장됩니다.`,
    ],
    [
      GROWTH_LOG_SHEET_NAME,
      "정기모임 회차",
      "선택",
      "숫자만 입력. 해당 기수에 등록된 회차가 없으면 미지정으로 저장됩니다.",
    ],
    [
      GROWTH_LOG_SHEET_NAME,
      "썸네일 URL",
      "선택",
      "이미 올라간 이미지 주소만 입력하세요. 비워두면 기존 썸네일이 유지됩니다.",
    ],
    [
      GROWTH_LOG_SHEET_NAME,
      "홈 노출",
      "선택",
      "O면 홈 활동 기록에도 표시됩니다. 비우면 X(개인 업적 페이지에만 표시)입니다.",
    ],
    [],
    ["※ 이름과 기수가 같은 멤버가 이미 있으면 새로 만들지 않고 기존 정보를 덮어씁니다."],
    ["※ 회원 구분(신입회원/정회원)은 현재 기수를 기준으로 자동 계산되므로 입력하지 않습니다."],
    ["※ 출결과 참여 프로젝트는 이 양식으로 등록할 수 없습니다. 회원 상세 관리에서 입력해주세요."],
  ];

  return createSheet(rows[0], rows.slice(1), [14, 22, 8, 70]);
}

/** 멤버 시트와 성장일지 시트, 안내 시트를 담은 워크북을 만듭니다. */
function createWorkbook(
  members: readonly MemberSheetRow[],
  growthLogs: readonly GrowthLogSheetRow[]
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, createMemberSheet(members), MEMBER_SHEET_NAME);
  XLSX.utils.book_append_sheet(
    workbook,
    createGrowthLogSheet(growthLogs),
    GROWTH_LOG_SHEET_NAME
  );
  XLSX.utils.book_append_sheet(workbook, createGuideSheet(), GUIDE_SHEET_NAME);
  return workbook;
}

/**
 * 예시가 채워진 빈 양식을 내려받습니다.
 */
export function downloadMemberTemplate(): void {
  const sampleMembers: MemberSheetRow[] = [
    {
      memberName: "홍길동",
      generation: 5,
      isActive: true,
      field: "Frontend",
      bio: "사용자 경험을 고민하는 프론트엔드 개발자입니다.",
      profileImageUrl: "",
    },
    {
      memberName: "김철수",
      generation: 5,
      isActive: true,
      field: "Backend",
      bio: "대용량 트래픽에 관심이 많습니다.",
      profileImageUrl: "",
    },
    {
      memberName: "이영희",
      generation: 4,
      isActive: false,
      field: "AI/ML",
      bio: "",
      profileImageUrl: "",
    },
  ];

  const sampleLogs: GrowthLogSheetRow[] = [
    {
      memberName: "홍길동",
      generation: 5,
      blogUrl: "https://example.com/posts/nextjs",
      title: "Next.js App Router 톺아보기",
      field: "Frontend",
      excerpt: "App Router의 렌더링 흐름을 정리했습니다.",
      round: 3,
      thumbnailUrl: "",
      showOnHome: false,
    },
  ];

  XLSX.writeFile(createWorkbook(sampleMembers, sampleLogs), "멤버_일괄등록_양식.xlsx");
}

/**
 * 현재 등록된 멤버와 성장일지를 채운 엑셀을 내려받습니다.
 *
 * 내려받아 수정한 뒤 그대로 다시 업로드하면 기존 정보가 갱신됩니다.
 *
 * @param members - 내보낼 멤버 행
 * @param growthLogs - 내보낼 성장일지 행
 * @param fileName - 저장할 파일명 (확장자 포함)
 */
export function downloadMemberExport(
  members: readonly MemberSheetRow[],
  growthLogs: readonly GrowthLogSheetRow[],
  fileName: string
): void {
  XLSX.writeFile(createWorkbook(members, growthLogs), fileName);
}

/**
 * 시트를 이름으로 찾습니다. 없으면 인덱스로 폴백합니다.
 *
 * 예전 양식은 시트가 하나뿐이었기 때문에, 멤버 시트는 첫 시트로도 찾습니다.
 */
function findSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  fallbackIndex: number | null
): XLSX.WorkSheet | null {
  const matched = workbook.Sheets[sheetName];
  if (matched) return matched;

  if (fallbackIndex === null) return null;
  const fallbackName = workbook.SheetNames[fallbackIndex];
  return fallbackName ? workbook.Sheets[fallbackName] ?? null : null;
}

/** 시트를 헤더 기준 객체 배열로 읽습니다. */
function readRows(sheet: XLSX.WorkSheet | null): Record<string, unknown>[] {
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
}

/**
 * 업로드한 엑셀 파일을 파싱합니다.
 *
 * @param data - 파일 바이트
 * @returns 멤버·성장일지 행과 건너뛴 행 수
 */
export function parseMemberWorkbook(data: Uint8Array): ParsedMemberWorkbook {
  const workbook = XLSX.read(data, { type: "array" });

  const members: MemberSheetRow[] = [];
  let skippedMemberRows = 0;

  for (const row of readRows(findSheet(workbook, MEMBER_SHEET_NAME, 0))) {
    const memberName = toText(row["멤버 이름"]);
    const generation = toNumber(row["가입 기수"]);

    if (!memberName || generation < 1) {
      // 완전히 빈 행은 엑셀에서 흔하므로 오류 집계에서 제외합니다.
      if (memberName || row["가입 기수"] != null) skippedMemberRows++;
      continue;
    }

    members.push({
      memberName,
      generation,
      isActive: parseFlag(row["가입 여부"], true),
      field: toText(row["기술 분야"]),
      bio: toText(row["한 줄 소개"]).slice(0, BIO_MAX_LENGTH),
      profileImageUrl: toText(row["프로필 이미지 URL"]),
    });
  }

  const growthLogs: GrowthLogSheetRow[] = [];
  let skippedGrowthLogRows = 0;

  for (const row of readRows(findSheet(workbook, GROWTH_LOG_SHEET_NAME, null))) {
    const memberName = toText(row["멤버 이름"]);
    const generation = toNumber(row["가입 기수"]);
    const blogUrl = toText(row["블로그 URL"]);
    const title = toText(row["제목"]);

    if (!memberName || generation < 1 || !blogUrl || !title) {
      if (memberName || blogUrl || title) skippedGrowthLogRows++;
      continue;
    }

    growthLogs.push({
      memberName,
      generation,
      blogUrl,
      title,
      field: toText(row["분야"]),
      excerpt: toText(row["요약"]).slice(0, EXCERPT_MAX_LENGTH),
      round: toNumber(row["정기모임 회차"]),
      thumbnailUrl: toText(row["썸네일 URL"]),
      // 개인 기록이 기본 목적이므로 명시하지 않으면 홈에 노출하지 않습니다.
      showOnHome: parseFlag(row["홈 노출"], false),
    });
  }

  return { members, growthLogs, skippedMemberRows, skippedGrowthLogRows };
}
