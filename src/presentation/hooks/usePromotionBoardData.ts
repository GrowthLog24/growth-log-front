"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PromotionBoardSnapshot } from "@/domain/entities";

const AUTO_REFRESH_INTERVAL = 60_000;

const EMPTY_SNAPSHOT: PromotionBoardSnapshot = {
  source: "google-sheets",
  sourceLabel: "Google Sheets",
  syncedAt: "",
  postRounds: [],
  boards: [],
};

/**
 * 방송대 홍보 게시 대상 스냅샷을 1분마다 자동으로 동기화합니다.
 * 첫 동기화 전에는 빈 목록을 표시하고, 연결에 실패하면 마지막으로 성공한 스냅샷을 유지합니다.
 */
export function usePromotionBoardData() {
  const [snapshot, setSnapshot] = useState<PromotionBoardSnapshot>(EMPTY_SNAPSHOT);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | undefined>(undefined);

  const refresh = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/admin/promotion-boards", {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await response.json() as PromotionBoardSnapshot | { error?: string };
      if (!response.ok || !("boards" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "Google Sheets 데이터를 읽지 못했습니다.");
      }

      setSnapshot(payload);
      setError("");
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : "Google Sheets 데이터를 읽지 못했습니다.");
    } finally {
      if (!controller.signal.aborted) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
      requestRef.current?.abort();
    };
  }, [refresh]);

  return { snapshot, isRefreshing, error, refresh };
}
