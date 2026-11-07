"use client";

import { useEffect, useState } from "react";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import type { Hackathon } from "@/domain/hackathon/types";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";

/** 행사 설정 구독 상태 */
export type HackathonConfigState =
  | { status: "loading" }
  | { status: "ready"; config: Hackathon | null }
  | { status: "error" };

/**
 * 현재 해커톤 설정을 실시간 구독합니다. 운영진이 시간을 바꾸면 즉시 반영됩니다.
 *
 * @returns {HackathonConfigState} loading | ready(config 또는 null) | error
 */
export function useHackathonConfig(): HackathonConfigState {
  const [state, setState] = useState<HackathonConfigState>({ status: "loading" });

  useEffect(() => {
    const unsubscribe = hackathonRepository.subscribeConfig(
      CURRENT_HACKATHON_ID,
      (config) => setState({ status: "ready", config }),
      (error) => {
        console.error("Hackathon config subscribe error:", error);
        setState({ status: "error" });
      }
    );
    return unsubscribe;
  }, []);

  return state;
}

/** 카운트다운 갱신 주기 */
const TICK_MS = 1000;

/**
 * 1초마다 갱신되는 현재 시각(epoch ms)을 돌려줍니다.
 *
 * @returns {number} 현재 시각
 */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return now;
}
