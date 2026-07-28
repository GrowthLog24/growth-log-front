import type {
  PromotionBoard,
  PromotionBoardSnapshot,
  PromotionBoardSourceKind,
  PromotionBoardStatus,
  PromotionPostingRound,
} from "@/domain/entities";

export type SheetCell = string | number | boolean | null | undefined;
export type SheetValues = SheetCell[][];
type SheetRecord = Record<string, SheetCell>;

/** 방송대 홍보 게시 현황을 관리하는 운영 Google Sheets */
export const GOOGLE_SHEETS_ID = "1gPZe8cwqKbMU2PBXg2V3mYLLT3MkhdkDZpTXcGqOtE0";
export const GOOGLE_SHEETS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/edit`;

export const GOOGLE_SHEETS_RANGES = {
  departments: { gid: "392712092", range: "A7:U1000" },
  regionals: { gid: "1190277445", range: "A6:T1000" },
} as const;

/**
 * 학과·지역대학 시트 값을 방송대 홍보 게시 대상 스냅샷으로 변환합니다.
 */
export function createBoardSnapshot({
  departmentValues,
  regionalValues,
  source,
  syncedAt,
}: {
  departmentValues: SheetValues;
  regionalValues: SheetValues;
  source: PromotionBoardSourceKind;
  syncedAt: string;
}): PromotionBoardSnapshot {
  const departments = recordsFromValues(departmentValues).map(mapDepartmentRecord);
  const regionals = recordsFromValues(regionalValues).map(mapRegionalRecord);

  return {
    source,
    sourceLabel: source === "google-sheets" ? "Google Sheets" : "엑셀 스냅샷",
    syncedAt,
    boards: [...departments, ...regionals],
  };
}

export function recordsFromValues(values: SheetValues): SheetRecord[] {
  const [headerRow = [], ...rows] = values;
  const headers = headerRow.map((cell) => String(cell ?? "").trim());

  return rows
    .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

function mapDepartmentRecord(record: SheetRecord): PromotionBoard {
  return {
    id: `department-${text(record["번호"])}`,
    group: text(record["단과대학"]),
    name: text(record["학과·학부/전공"]),
    type: "학과",
    boardName: text(record["게시판 명칭"]),
    status: normalizeStatus(record["확인 상태"]),
    homepageUrl: text(record["학과 대표 홈페이지"]),
    boardUrl: text(record["게시판/확인 링크"]),
    lastChecked: normalizeDate(record["확인일"]),
    note: text(record["비고"]),
    totalPosts: nullableNumber(record["총계"]),
    postings: mapPostings(record),
  };
}

function mapRegionalRecord(record: SheetRecord): PromotionBoard {
  return {
    id: `regional-${text(record["번호"])}`,
    group: "지역대학",
    name: text(record["지역대학"]),
    type: "지역대학",
    boardName: text(record["게시판 명칭"]),
    status: normalizeStatus(record["확인 상태"]),
    homepageUrl: text(record["지역대학 대표 홈페이지"]),
    boardUrl: text(record["지역대학 메뉴 링크"]),
    lastChecked: normalizeDate(record["확인일"]),
    note: text(record["자유게시판 여부"]) === "없음" ? "자유게시판 아님" : text(record["자유게시판 여부"]),
    totalPosts: nullableNumber(record["총계"]),
    postings: mapPostings(record),
  };
}

function mapPostings(record: SheetRecord): PromotionPostingRound[] {
  return ([1, 2, 3] as const).map((round) => ({
    round,
    postedAt: normalizeDate(record[`${round}차 게시`]),
    postUrl: text(record[`${round}차 링크`]),
    count: nullableNumber(record[`${round}차 소계`]),
  }));
}

function normalizeStatus(value: SheetCell): PromotionBoardStatus {
  const status = text(value);
  if (status === "확인됨") return "준비됨";
  if (status.includes("없음")) return "게시판 없음";
  return "확인 필요";
}

function normalizeDate(value: SheetCell): string {
  if (typeof value === "number") {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + value * 86_400_000).toISOString().slice(0, 10);
  }

  return text(value).replaceAll(".", "-");
}

function text(value: SheetCell): string {
  return String(value ?? "").trim();
}

function nullableNumber(value: SheetCell): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
