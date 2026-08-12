/** 운영진 PC에서 실행되는 Growth Log 연결 앱(Electron, Playwright 기반) 로컬 서버 주소 */
export const PLAYWRIGHT_HELPER_URL = "http://127.0.0.1:4317";
export const PLAYWRIGHT_HELPER_PROTOCOL = "growthlog-connector";
export const PLAYWRIGHT_HELPER_TOKEN_KEY = "growth-log-connector-token";
export const PLAYWRIGHT_HELPER_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_CONNECTOR_DOWNLOAD_URL ?? "";

export type PlaywrightHelperStatus = "checking" | "connected" | "pairing" | "missing" | "error";

export type ModificationJob = {
  boardId: string;
  boardName: string;
  postUrl: string;
  title: string;
  html: string;
  /** true면 연결 앱이 방송대 최종 저장·등록까지 자동으로 실행합니다. false면 내용만 채우고 사람이 최종 저장합니다. */
  confirmFinalSubmit: boolean;
};

export type CreationJob = {
  boardId: string;
  boardName: string;
  boardUrl: string;
  title: string;
  html: string;
  /** 1부터 시작하는 게시 회차. 연결 앱은 게시 성공 시 운영 시트의 해당 회차에 날짜·제목·링크를 기록합니다. */
  round: number;
  /** true면 연결 앱이 방송대 최종 저장·등록까지 자동으로 실행합니다. false면 내용만 채우고 사람이 최종 저장합니다. */
  confirmFinalSubmit: boolean;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type TistoryAttachment = {
  id: string;
  name: string;
  dataUrl: string;
};

export type TistoryDraftRequest = {
  blogUrl: string;
  category: string;
  title: string;
  html: string;
  tags: string[];
  attachments: TistoryAttachment[];
};

export type TistoryDraftJob = Omit<TistoryDraftRequest, "blogUrl" | "category"> & {
  source: string;
  status: "ready" | "running" | "done" | "failed";
  message: string;
};

export type HelperResult = {
  ok: boolean;
  authorized?: boolean;
  status?: string;
  code?: string;
  message: string;
  pageUrl?: string;
};
