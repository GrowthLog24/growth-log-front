import type { ChallengeData } from "../_shared/types";

/**
 * 어반핏 2기 · 주 3회 운동 챌린지 10주 최종 결산 데이터
 * 기간: 2026-06-22 ~ 08-30 (10주 완주).
 * 출처: Slack #05_01_클럽_urban-fit 인증 전수 집계.
 *   - 헤더 날짜 기준 주차 배정(본인 [N주차] 라벨 무시)
 *   - 1 메시지 = 1 회, 러닝넘버(N/30)로 중복·누락·오기재 교차검증
 *   - 요일 라벨 vs 실제 요일 대조로 오기재 날짜 정정
 *   보정: 부혜선 6/27 중복게시 1건 제거 · (5/40) 오타건 유효 인증 포함 ·
 *         이준혁 #22, 김태홍 #17 넘버 오기(다른 날, 둘 다 유효) · 박예승 #4 넘버 스킵.
 */
export const urbanfit2: ChallengeData = {
  meta: {
    eyebrow: "Urbanfit Challenge · Season 2 · Final",
    title: "주 3회 운동 챌린지 2기",
    titleAccent: "10주 최종 결산",
    meta: "10 WEEKS / 12 MEMBERS",
    totalWeeks: 10,
  },
  kpis: [
    {
      label: "Total Check-ins",
      value: "180",
      unit: "회",
      sub: "12명 10주 누적 인증",
      featured: true,
    },
    { label: "참가 인원", value: "12", unit: "명", sub: "전원 시작부터 참여" },
    { label: "주차당 평균 인증", value: "18.0", unit: "회", sub: "10주 평균" },
    {
      label: "개근(주 3회 완수) 멤버",
      value: "1",
      unit: "명",
      sub: "남혜민",
    },
  ],
  weekStats: [
    { week: 1, total: 21, success: 5, fail: 7 },
    { week: 2, total: 22, success: 4, fail: 8 },
    { week: 3, total: 26, success: 6, fail: 6 },
    { week: 4, total: 25, success: 6, fail: 6 },
    { week: 5, total: 24, success: 6, fail: 6 },
    { week: 6, total: 16, success: 4, fail: 8 },
    { week: 7, total: 16, success: 4, fail: 8 },
    { week: 8, total: 13, success: 2, fail: 10 },
    { week: 9, total: 7, success: 2, fail: 10 },
    { week: 10, total: 10, success: 3, fail: 9 },
  ],
  members: [
    { name: "남혜민", weekly: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], total: 30, success: 10 },
    { name: "이준혁", weekly: [3, 5, 4, 3, 3, 4, 2, 4, 3, 3], total: 34, success: 9 },
    { name: "김민경", weekly: [3, 4, 3, 2, 3, 3, 3, 1, 0, 0], total: 22, success: 6 },
    { name: "김종진", weekly: [3, 1, 3, 3, 3, 2, 3, 0, 0, 3], total: 21, success: 6 },
    { name: "부혜선", weekly: [3, 1, 1, 3, 3, 3, 3, 2, 0, 0], total: 19, success: 5 },
    { name: "김태홍", weekly: [2, 2, 3, 2, 3, 1, 1, 2, 1, 1], total: 18, success: 2 },
    { name: "안혜린", weekly: [1, 0, 5, 4, 2, 0, 0, 0, 0, 0], total: 12, success: 2 },
    { name: "이재인", weekly: [0, 3, 2, 1, 2, 0, 0, 0, 0, 0], total: 8, success: 1 },
    { name: "서지영", weekly: [0, 0, 0, 3, 2, 0, 0, 1, 0, 0], total: 6, success: 1 },
    { name: "박예승", weekly: [2, 2, 2, 0, 0, 0, 1, 0, 0, 0], total: 7, success: 0 },
    { name: "이예솔", weekly: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0], total: 2, success: 0 },
    { name: "엄수현", weekly: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 1, success: 0 },
  ],
  honors: [
    {
      rank: "★ MVP · 완벽 개근",
      name: "남혜민",
      big: "10/10",
      detail: "총 30회 · 유일 개근",
      gold: true,
    },
    {
      rank: "★ 최다상 · 최다 인증",
      name: "이준혁",
      big: "34회",
      detail: "9주 성공 · 목표 초과",
    },
    {
      rank: "★ 꾸준상 · 6주 이상",
      name: "김민경 · 김종진",
      big: "6/10",
      detail: "각 6주 성공",
    },
  ],
  footer: {
    lead: "주 3회 운동 챌린지 2기",
    highlight: "10주간 총 180회 인증 완료",
    tail: "10주간 수고하셨습니다 💪",
  },
};
