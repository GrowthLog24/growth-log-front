import { fetchGoogleSheetsBoardSnapshot } from "@/infrastructure/external/knouBoards/googleSheets";

export async function GET() {
  try {
    const snapshot = await fetchGoogleSheetsBoardSnapshot();
    return Response.json(snapshot, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Sheets 데이터를 읽지 못했습니다.";
    return Response.json({ error: message }, {
      status: 502,
      headers: { "cache-control": "no-store" },
    });
  }
}
