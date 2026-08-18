import type { PromotionBoardSnapshot } from "@/domain/entities";
import {
  GOOGLE_SHEETS_ID,
  GOOGLE_SHEETS_RANGES,
  createBoardSnapshot,
  type SheetCell,
  type SheetValues,
} from "./boardSheetSource";

type GoogleVisualizationCell = {
  v?: SheetCell;
  f?: string;
};

type GoogleVisualizationResponse = {
  status?: string;
  errors?: Array<{ detailed_message?: string; message?: string }>;
  table?: {
    cols?: Array<{ label?: string }>;
    rows?: Array<{ c?: Array<GoogleVisualizationCell | null> }>;
  };
};

export function parseGoogleVisualizationResponse(payload: string): SheetValues {
  const start = payload.indexOf("{");
  const end = payload.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Google Sheets 응답 형식이 올바르지 않습니다.");

  const parsed = JSON.parse(payload.slice(start, end + 1)) as GoogleVisualizationResponse;
  if (parsed.status !== "ok" || !parsed.table) {
    const detail = parsed.errors?.[0]?.detailed_message ?? parsed.errors?.[0]?.message;
    throw new Error(detail || "Google Sheets 데이터를 읽지 못했습니다.");
  }

  const headers = (parsed.table.cols ?? []).map((column) => column.label?.trim() ?? "");
  const rows = (parsed.table.rows ?? []).map((row) =>
    headers.map((_, index) => {
      const cell = row.c?.[index];
      if (!cell) return null;
      return cell.f ?? cell.v ?? null;
    }),
  );

  return [headers, ...rows];
}

async function fetchSheetValues(gid: string, range: string): Promise<SheetValues> {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq`);
  url.searchParams.set("tqx", "out:json");
  url.searchParams.set("gid", gid);
  url.searchParams.set("range", range);
  url.searchParams.set("headers", "1");

  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json,text/plain,*/*" },
  });
  if (!response.ok) throw new Error(`Google Sheets 요청 실패 (${response.status})`);

  return parseGoogleVisualizationResponse(await response.text());
}

/**
 * 방송대 홍보 게시 운영 시트(학과·지역대학)를 공개 gviz 엔드포인트로 동기화합니다.
 */
export async function fetchGoogleSheetsBoardSnapshot(): Promise<PromotionBoardSnapshot> {
  const [departmentValues, regionalValues] = await Promise.all([
    fetchSheetValues(GOOGLE_SHEETS_RANGES.departments.gid, GOOGLE_SHEETS_RANGES.departments.range),
    fetchSheetValues(GOOGLE_SHEETS_RANGES.regionals.gid, GOOGLE_SHEETS_RANGES.regionals.range),
  ]);

  return createBoardSnapshot({
    departmentValues,
    regionalValues,
    source: "google-sheets",
    syncedAt: new Date().toISOString(),
  });
}
