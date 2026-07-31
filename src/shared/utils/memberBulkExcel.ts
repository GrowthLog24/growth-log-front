import * as XLSX from "xlsx";
import type { AttendanceStatus } from "@/domain/entities";

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

/** 출결 시트 이름 */
export const ATTENDANCE_SHEET_NAME = "출결";

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

/** 출결 시트의 고정 컬럼 (뒤에 회차 컬럼이 동적으로 붙습니다) */
const ATTENDANCE_FIXED_COLUMNS = ["멤버 이름", "가입 기수"] as const;

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

/**
 * 출결 시트의 회차 컬럼
 *
 * 회차 번호는 기수마다 따로 매겨지므로 기수와 함께 다뤄야 합니다.
 */
export interface MeetingColumn {
  /** 회차가 속한 기수 */
  generation: number;
  /** 회차 번호 */
  round: number;
}

/** 출결 셀 하나 */
export interface AttendanceCell {
  /** 회차가 속한 기수 */
  meetingGeneration: number;
  round: number;
  status: AttendanceStatus;
}

/** 출결 시트 한 행 (한 멤버) */
export interface AttendanceSheetRow {
  memberName: string;
  generation: number;
  /** 값이 입력된 셀만 담습니다. 빈 칸은 "변경 없음"이라 여기에 없습니다. */
  cells: AttendanceCell[];
}

/** 워크북에 담을 데이터 */
export interface MemberWorkbookData {
  members: readonly MemberSheetRow[];
  growthLogs: readonly GrowthLogSheetRow[];
  attendance: readonly AttendanceSheetRow[];
  /** 출결 시트에 만들 회차 컬럼 (등록된 정기모임에서 만듭니다) */
  meetingColumns: readonly MeetingColumn[];
}

/** 업로드한 워크북 파싱 결과 */
export interface ParsedMemberWorkbook {
  members: MemberSheetRow[];
  growthLogs: GrowthLogSheetRow[];
  attendance: AttendanceSheetRow[];
  /** 필수값이 비어 건너뛴 멤버 행 수 */
  skippedMemberRows: number;
  /** 필수값이 비어 건너뛴 성장일지 행 수 */
  skippedGrowthLogRows: number;
  /** 출결 상태로 해석할 수 없어 건너뛴 셀 수 */
  invalidAttendanceCells: number;
}

/** O/X 표기를 불리언으로 해석할 때 거짓으로 볼 값들 */
const FALSY_FLAGS = ["X", "N", "NO", "FALSE", "0", "미노출", "비활성"];

/**
 * 출결 상태로 인정하는 표기들
 *
 * 운영진이 손으로 채우는 칸이라 약자와 기호도 함께 받습니다.
 * 키는 공백을 제거하고 대문자로 바꾼 형태입니다.
 */
const ATTENDANCE_ALIASES: Record<string, AttendanceStatus> = {
  출석: "present",
  참석: "present",
  출: "present",
  O: "present",
  "○": "present",
  "◯": "present",
  ㅇ: "present",
  지각: "late",
  지: "late",
  "△": "late",
  "▲": "late",
  사유결석: "excused",
  사유: "excused",
  공결: "excused",
  "◇": "excused",
  결석: "absent",
  불참: "absent",
  결: "absent",
  X: "absent",
  "✕": "absent",
  "✗": "absent",
};

/** 출결 상태를 엑셀에 쓸 라벨로 변환합니다. */
const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "출석",
  late: "지각",
  excused: "사유 결석",
  absent: "결석",
};

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
 * 출결 셀 값을 상태로 변환합니다.
 *
 * @param value - 셀 원본 값
 * @returns 빈 칸이면 null(변경 없음), 해석할 수 없으면 undefined
 */
function parseAttendanceStatus(
  value: unknown
): AttendanceStatus | null | undefined {
  const normalized = String(value ?? "").replace(/\s+/g, "").toUpperCase();
  if (normalized === "") return null;
  return ATTENDANCE_ALIASES[normalized];
}

/** 회차 컬럼의 헤더 문자열을 만듭니다. */
function formatMeetingColumn(column: MeetingColumn): string {
  return `${column.generation}기 ${column.round}회차`;
}

/**
 * 회차 컬럼 헤더를 기수·회차로 되돌립니다.
 *
 * @param header - 시트 헤더 문자열
 * @returns 회차 컬럼이 아니면 null
 */
function parseMeetingColumn(header: string): MeetingColumn | null {
  const matched = header.trim().match(/^(\d+)\s*기\s*(\d+)\s*회차$/);
  if (!matched) return null;
  return {
    generation: Number(matched[1]),
    round: Number(matched[2]),
  };
}

/** 회차 컬럼을 기수·회차 오름차순으로 정렬합니다. */
function sortMeetingColumns(columns: readonly MeetingColumn[]): MeetingColumn[] {
  return [...columns].sort(
    (a, b) => a.generation - b.generation || a.round - b.round
  );
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

/**
 * 출결 시트를 만듭니다.
 *
 * 멤버가 속하지 않은 기수의 회차 칸은 해당 사항이 없으므로 비워둡니다.
 */
function createAttendanceSheet(
  rows: readonly AttendanceSheetRow[],
  meetingColumns: readonly MeetingColumn[]
): XLSX.WorkSheet {
  const columns = sortMeetingColumns(meetingColumns);
  const header = [
    ...ATTENDANCE_FIXED_COLUMNS,
    ...columns.map(formatMeetingColumn),
  ];

  const body = rows.map((row) => {
    const statusByKey = new Map(
      row.cells.map((cell) => [
        `${cell.meetingGeneration}-${cell.round}`,
        cell.status,
      ])
    );

    return [
      row.memberName,
      row.generation,
      ...columns.map((column) => {
        if (column.generation !== row.generation) return "";
        const status = statusByKey.get(`${column.generation}-${column.round}`);
        return status ? ATTENDANCE_LABELS[status] : "";
      }),
    ];
  });

  return createSheet(header, body, [14, 10, ...columns.map(() => 12)]);
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
    [
      ATTENDANCE_SHEET_NAME,
      "멤버 이름 / 가입 기수",
      "필수",
      "멤버 목록 시트의 값과 정확히 같아야 연결됩니다.",
    ],
    [
      ATTENDANCE_SHEET_NAME,
      "N기 M회차",
      "선택",
      "출석 / 지각 / 사유 결석 / 결석 중 하나를 입력하세요. 참석·O(출석), △(지각), X·불참(결석) 같은 표기도 인식합니다.",
    ],
    [],
    ["※ 이름과 기수가 같은 멤버가 이미 있으면 새로 만들지 않고 기존 정보를 덮어씁니다."],
    ["※ 회원 구분(신입회원/정회원)은 현재 기수를 기준으로 자동 계산되므로 입력하지 않습니다."],
    ["※ 출결의 빈 칸은 '변경 없음'입니다. 기록을 지우려면 '결석'이라고 명시해주세요."],
    ["※ 출결의 회차 컬럼은 등록된 정기모임에서 자동으로 만들어집니다. 컬럼 이름을 바꾸지 마세요."],
    ["※ 자기 기수가 아닌 회차 칸에 입력한 값은 반영되지 않습니다."],
    ["※ 참여 프로젝트는 이 양식으로 등록할 수 없습니다. 회원 상세 관리에서 입력해주세요."],
  ];

  return createSheet(rows[0], rows.slice(1), [14, 22, 8, 70]);
}

/** 시트 4개를 담은 워크북을 만듭니다. */
function createWorkbook(data: MemberWorkbookData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    createMemberSheet(data.members),
    MEMBER_SHEET_NAME
  );
  XLSX.utils.book_append_sheet(
    workbook,
    createGrowthLogSheet(data.growthLogs),
    GROWTH_LOG_SHEET_NAME
  );
  XLSX.utils.book_append_sheet(
    workbook,
    createAttendanceSheet(data.attendance, data.meetingColumns),
    ATTENDANCE_SHEET_NAME
  );
  XLSX.utils.book_append_sheet(workbook, createGuideSheet(), GUIDE_SHEET_NAME);
  return workbook;
}

/**
 * 예시가 채워진 빈 양식을 내려받습니다.
 *
 * @param meetingColumns - 출결 시트에 만들 회차 컬럼.
 *   등록된 정기모임이 없으면 형식을 보여주기 위한 예시 회차를 넣습니다.
 */
export function downloadMemberTemplate(
  meetingColumns: readonly MeetingColumn[]
): void {
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

  const columns: readonly MeetingColumn[] =
    meetingColumns.length > 0
      ? meetingColumns
      : [
          { generation: 5, round: 1 },
          { generation: 5, round: 2 },
        ];

  const sampleAttendance: AttendanceSheetRow[] = sampleMembers.map((member) => ({
    memberName: member.memberName,
    generation: member.generation,
    cells: columns
      .filter((column) => column.generation === member.generation)
      .map((column, index) => ({
        meetingGeneration: column.generation,
        round: column.round,
        // 입력값 예시를 보여주기 위해 상태를 번갈아 넣습니다.
        status: index % 2 === 0 ? "present" : "late",
      })),
  }));

  XLSX.writeFile(
    createWorkbook({
      members: sampleMembers,
      growthLogs: sampleLogs,
      attendance: sampleAttendance,
      meetingColumns: columns,
    }),
    "멤버_일괄등록_양식.xlsx"
  );
}

/**
 * 현재 등록된 멤버·성장일지·출결을 채운 엑셀을 내려받습니다.
 *
 * 내려받아 수정한 뒤 그대로 다시 업로드하면 기존 정보가 갱신됩니다.
 *
 * @param data - 내보낼 데이터
 * @param fileName - 저장할 파일명 (확장자 포함)
 */
export function downloadMemberExport(
  data: MemberWorkbookData,
  fileName: string
): void {
  XLSX.writeFile(createWorkbook(data), fileName);
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
 * @returns 시트별 행과 건너뛴 항목 수
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

  const attendance: AttendanceSheetRow[] = [];
  let invalidAttendanceCells = 0;

  for (const row of readRows(findSheet(workbook, ATTENDANCE_SHEET_NAME, null))) {
    const memberName = toText(row["멤버 이름"]);
    const generation = toNumber(row["가입 기수"]);
    if (!memberName || generation < 1) continue;

    const cells: AttendanceCell[] = [];

    for (const [header, value] of Object.entries(row)) {
      const column = parseMeetingColumn(header);
      if (!column) continue;

      const status = parseAttendanceStatus(value);
      // null은 빈 칸(변경 없음)이므로 오류가 아닙니다.
      if (status === null) continue;
      if (status === undefined) {
        invalidAttendanceCells++;
        continue;
      }

      cells.push({
        meetingGeneration: column.generation,
        round: column.round,
        status,
      });
    }

    if (cells.length === 0) continue;
    attendance.push({ memberName, generation, cells });
  }

  return {
    members,
    growthLogs,
    attendance,
    skippedMemberRows,
    skippedGrowthLogRows,
    invalidAttendanceCells,
  };
}
