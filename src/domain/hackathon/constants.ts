import type { HackathonTrack } from "./types";

/** 이번 행사 ID (6기 11월 정기모임 100분 해커톤) */
export const CURRENT_HACKATHON_ID = "gl6-2026-11";

/** 트랙 라벨 (11월 행사준비 회의 2차 기준) */
export const HACKATHON_TRACKS: Record<
  HackathonTrack,
  { name: string; description: string }
> = {
  A: { name: "Learn", description: "개발 공부 또는 성장에 관련된 프로그램" },
  B: { name: "Connect", description: "커뮤니티의 소통 또는 친목을 위한 프로그램" },
  C: { name: "Build", description: "그로스로그 운영에 도움이 되는 프로그램" },
  D: { name: "Free", description: "자유주제 프로그램" },
};

export const HACKATHON_TRACK_KEYS: readonly HackathonTrack[] = ["A", "B", "C", "D"];

/** 남은 시간 공지 시점 (분) — 타임테이블의 16:50 / 17:00 / 17:09 공지 */
export const HACKATHON_NOTICE_MINUTES: readonly number[] = [20, 10, 1];

/** 텍스트 필드 최대 길이 */
export const HACKATHON_TEXT_LIMITS = {
  projectName: 40,
  oneLiner: 80,
  plan: 1500,
  url: 500,
} as const;
