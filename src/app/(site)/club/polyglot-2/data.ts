import type { ChallengeData } from "../_shared/types";

/**
 * 폴리글랏 2기 · 주 3회 외국어 학습 챌린지 10주 최종 결산 데이터
 * 기간: 2026-06-22 ~ 08-30 (10주 완주).
 * 출처: Slack #05_02_클럽_polyglot 인증 전수 집계.
 *   - 헤더 날짜 기준 주차 배정(본인 [N주차] 라벨 무시)
 *   - 1 메시지 = 1 회, 러닝넘버(N/30)로 중복·누락·오기재 교차검증
 *   - 요일 라벨 vs 실제 요일 대조로 오기재 날짜 정정
 *   보정: 부혜선 표기 7/26 → 실제 7/27(W5→W6, 요일·게시일·"오늘 했습니다" 근거) ·
 *         김태홍 #12 넘버 스킵 · 안혜린 5일치 몰아쓰기(러닝 +1) → 1회 집계.
 *   (1기 멤버였던 이준혁은 2기 폴리글랏 미참여.)
 */
export const polyglot2: ChallengeData = {
  meta: {
    eyebrow: "Polyglot Challenge · Season 2 · Final",
    title: "주 3회 외국어 학습 챌린지 2기",
    titleAccent: "10주 최종 결산",
    meta: "10 WEEKS / 7 MEMBERS",
    totalWeeks: 10,
  },
  kpis: [
    {
      label: "Total Check-ins",
      value: "113",
      unit: "회",
      sub: "7명 10주 누적 인증",
      featured: true,
    },
    { label: "참가 인원", value: "7", unit: "명", sub: "전원 시작부터 참여" },
    { label: "주차당 평균 인증", value: "11.3", unit: "회", sub: "10주 평균" },
    {
      label: "개근(주 3회 완수) 멤버",
      value: "0",
      unit: "명",
      sub: "남혜민·박창현 9주",
    },
  ],
  weekStats: [
    { week: 1, total: 14, success: 4, fail: 3 },
    { week: 2, total: 15, success: 3, fail: 4 },
    { week: 3, total: 16, success: 4, fail: 3 },
    { week: 4, total: 20, success: 5, fail: 2 },
    { week: 5, total: 14, success: 4, fail: 3 },
    { week: 6, total: 11, success: 2, fail: 5 },
    { week: 7, total: 6, success: 2, fail: 5 },
    { week: 8, total: 5, success: 1, fail: 6 },
    { week: 9, total: 6, success: 2, fail: 5 },
    { week: 10, total: 6, success: 2, fail: 5 },
  ],
  members: [
    { name: "남혜민", weekly: [3, 3, 2, 4, 3, 3, 3, 3, 3, 3], total: 30, success: 9 },
    { name: "박창현", weekly: [3, 3, 3, 3, 3, 3, 3, 2, 3, 3], total: 29, success: 9 },
    { name: "김민경", weekly: [3, 2, 3, 3, 3, 2, 0, 0, 0, 0], total: 16, success: 4 },
    { name: "김태홍", weekly: [1, 3, 3, 2, 3, 2, 0, 0, 0, 0], total: 14, success: 3 },
    { name: "안혜린", weekly: [4, 0, 3, 5, 0, 0, 0, 0, 0, 0], total: 12, success: 3 },
    { name: "부혜선", weekly: [0, 2, 2, 3, 2, 1, 0, 0, 0, 0], total: 10, success: 1 },
    { name: "이예솔", weekly: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0], total: 2, success: 0 },
  ],
  honors: [
    {
      rank: "★ MVP · 최다 인증",
      name: "남혜민",
      big: "30회",
      detail: "9주 성공 · 어반핏 동시 완주",
      gold: true,
    },
    {
      rank: "★ RUNNER-UP · 최장 완주",
      name: "박창현",
      big: "9/10",
      detail: "총 29회",
    },
    {
      rank: "★ 꾸준상 · 4주 이상",
      name: "김민경",
      big: "4/10",
      detail: "4주 성공",
    },
  ],
  footer: {
    lead: "주 3회 외국어 학습 챌린지 2기",
    highlight: "10주간 총 113회 인증 완료",
    tail: "10주간 수고하셨습니다 📚",
  },
};
