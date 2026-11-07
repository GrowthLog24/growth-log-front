"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseStoredVote, type StoredVote } from "./voteView";

/** 같은 탭 안에서 저장 변경을 알리는 이벤트 이름 */
const STORAGE_EVENT = "growthlog:hackathon-vote-storage";

function storageKey(hackathonId: string): string {
  return `growthlog:hackathon-vote:${hackathonId}`;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch (error) {
    // 사생활 보호 모드 등에서 저장이 막혀도 투표 자체는 서버에 기록되어 있으므로 진행한다.
    console.warn("투표 기록을 이 기기에 저장하지 못했습니다:", error);
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/**
 * 이 기기에서 마친 투표 기록을 localStorage로 읽고 씁니다.
 * 저장소 접근이 막혀 있으면 기록 없음(null)으로 동작합니다.
 *
 * @param {string} hackathonId - 행사 ID
 * @returns {{ storedVote: StoredVote | null; saveVote: (vote: StoredVote) => void; clearVote: () => void }}
 */
export function useStoredVote(hackathonId: string) {
  const key = storageKey(hackathonId);
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const storedVote = useMemo(() => parseStoredVote(raw), [raw]);

  const saveVote = useCallback(
    (vote: StoredVote) => writeStorage(key, JSON.stringify(vote)),
    [key]
  );
  const clearVote = useCallback(() => writeStorage(key, null), [key]);

  return { storedVote, saveVote, clearVote };
}
