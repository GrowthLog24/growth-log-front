import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import type { TeamAuth } from "./submitApi";

const STORAGE_KEY = `hackathon-submit-team:${CURRENT_HACKATHON_ID}`;

/**
 * sessionStorage에 저장된 팀 인증 정보를 읽습니다. 없거나 접근 불가면 null.
 *
 * @returns {TeamAuth | null} 저장된 팀 인증 정보
 */
export function loadTeamSession(): TeamAuth | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { teamId, code } = parsed as Record<string, unknown>;
    if (typeof teamId !== "string" || typeof code !== "string") return null;
    return { teamId, code };
  } catch {
    return null;
  }
}

/**
 * 팀 인증 정보를 sessionStorage에 저장합니다. 실패해도 화면 흐름은 계속됩니다.
 *
 * @param {TeamAuth} auth - 저장할 팀 인증 정보
 */
export function saveTeamSession(auth: TeamAuth): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch (error) {
    console.warn("팀 정보를 브라우저에 저장하지 못했습니다:", error);
  }
}

/** 저장된 팀 인증 정보를 지웁니다. */
export function clearTeamSession(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("팀 정보를 지우지 못했습니다:", error);
  }
}
