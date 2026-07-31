"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PLAYWRIGHT_HELPER_PROTOCOL,
  PLAYWRIGHT_HELPER_TOKEN_KEY,
  PLAYWRIGHT_HELPER_URL,
  type CreationJob,
  type HelperResult,
  type LoginCredentials,
  type ModificationJob,
  type PlaywrightHelperStatus,
  type TistoryDraftRequest,
} from "@/shared/lib/playwrightHelper";

function getPairingToken() {
  let token = window.localStorage.getItem(PLAYWRIGHT_HELPER_TOKEN_KEY);
  if (!token) {
    token = window.crypto.randomUUID();
    window.localStorage.setItem(PLAYWRIGHT_HELPER_TOKEN_KEY, token);
  }
  return token;
}

async function fetchWithTimeout(path: string, init?: RequestInit, timeoutMs = 1_500) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init?.headers);
  headers.set("X-Growth-Log-Token", getPairingToken());

  try {
    return await fetch(`${PLAYWRIGHT_HELPER_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function parseResult(response: Response): Promise<HelperResult> {
  const fallback = {
    ok: false,
    message: `로컬 도우미 요청에 실패했습니다. (${response.status})`,
  };
  const data: unknown = await response.json().catch(() => fallback);

  if (
    typeof data === "object"
    && data !== null
    && "ok" in data
    && typeof data.ok === "boolean"
    && "message" in data
    && typeof data.message === "string"
  ) {
    return data as HelperResult;
  }
  return fallback;
}

function statusForResult(response: Response, result: HelperResult): PlaywrightHelperStatus {
  if (result.code === "PAIRING_REQUIRED" || result.authorized === false) return "pairing";
  if (!response.ok) return "error";
  return "connected";
}

/**
 * 운영진 PC의 Growth Log 연결 앱(로컬 Playwright 자동화 서버)과 통신합니다.
 * 연결 상태 확인, 페어링, 로그인/게시/수정 자동화 요청을 제공합니다.
 */
export function usePlaywrightHelper() {
  const [status, setStatus] = useState<PlaywrightHelperStatus>("checking");
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const check = useCallback(async () => {
    setStatus("checking");
    setError("");
    try {
      const response = await fetchWithTimeout("/health");
      if (!response.ok) throw new Error(`연결 응답 ${response.status}`);
      const result = await parseResult(response);
      setStatus(statusForResult(response, result));
    } catch {
      setStatus("missing");
    }
  }, []);

  const pair = useCallback(async () => {
    const token = getPairingToken();
    const origin = window.location.origin;
    const deepLink = `${PLAYWRIGHT_HELPER_PROTOCOL}://pair?origin=${encodeURIComponent(origin)}&token=${encodeURIComponent(token)}`;
    const anchor = document.createElement("a");
    anchor.href = deepLink;
    anchor.click();
    setStatus("checking");
    setError("");

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      try {
        const response = await fetchWithTimeout("/health");
        if (!response.ok) continue;
        const result = await parseResult(response);
        if (statusForResult(response, result) === "connected") {
          setStatus("connected");
          return {
            ok: true,
            message: "Growth Log 연결 앱과 연결되었습니다.",
          } satisfies HelperResult;
        }
      } catch {
        // 연결 앱이 아직 열리는 중이거나 사용자 승인을 기다리는 중일 수 있습니다.
      }
    }

    setStatus("pairing");
    return {
      ok: false,
      code: "PAIRING_PENDING",
      message: "연결 앱에서 이 운영 프로그램의 연결을 허용한 뒤 다시 확인해 주세요.",
    } satisfies HelperResult;
  }, []);

  useEffect(() => {
    void check();
    const handleFocus = () => void check();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [check]);

  const request = useCallback(async (path: string, body?: unknown, timeoutMs = 30_000) => {
    setIsWorking(true);
    setError("");
    try {
      const response = await fetchWithTimeout(
        path,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        },
        timeoutMs,
      );
      const result = await parseResult(response);
      setStatus(statusForResult(response, result));
      if (!result.ok) setError(result.message);
      return result;
    } catch {
      const result = {
        ok: false,
        code: "HELPER_UNAVAILABLE",
        message: "로컬 Playwright 도우미에 연결할 수 없습니다. Growth Log 연결 앱이 실행 중인지 확인해 주세요.",
      };
      setStatus("missing");
      setError(result.message);
      return result;
    } finally {
      setIsWorking(false);
    }
  }, []);

  const openLogin = useCallback(() => request("/login"), [request]);
  const autoLogin = useCallback((credentials: LoginCredentials) => request("/login-auto", credentials), [request]);
  const prepareModification = useCallback((job: ModificationJob) => request("/modify", job), [request]);
  const prepareCreation = useCallback((job: CreationJob) => request("/create", job), [request]);
  const openTistoryLogin = useCallback((blogUrl: string) => request("/tistory/login", { blogUrl }), [request]);
  const saveTistoryDraft = useCallback(
    (job: TistoryDraftRequest) => request("/tistory/draft", job, 180_000),
    [request],
  );

  return {
    status,
    error,
    isWorking,
    check,
    pair,
    openLogin,
    autoLogin,
    prepareModification,
    prepareCreation,
    openTistoryLogin,
    saveTistoryDraft,
  };
}
