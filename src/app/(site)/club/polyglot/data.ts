import type { ChallengeData } from "../_shared/types";

/** 폴리글랏 · 주 3회 외국어 학습 챌린지 10주 결산 데이터 */
export const polyglot: ChallengeData = {
  meta: {
    eyebrow: "Polyglot Challenge · Season Report",
    title: "주 3회 외국어 학습 챌린지",
    titleAccent: "10주 결산",
    meta: "10 WEEKS / 8 MEMBERS",
    totalWeeks: 10,
  },
  kpis: [
    {
      label: "Total Check-ins",
      value: "193",
      unit: "회",
      sub: "8명 10주 누적 인증",
      featured: true,
    },
    { label: "참가 인원", value: "8", unit: "명", sub: "중간 합류 1명 포함" },
    { label: "주차당 평균 인증", value: "19.3", unit: "회", sub: "10주 평균" },
    {
      label: "개근(주 3회 완수) 멤버",
      value: "1",
      unit: "명",
      sub: "남혜민",
    },
  ],
  weekStats: [
    { week: 1, total: 19, success: 6, fail: 1 },
    { week: 2, total: 16, success: 5, fail: 2 },
    { week: 3, total: 22, success: 6, fail: 1 },
    { week: 4, total: 21, success: 6, fail: 1 },
    { week: 5, total: 20, success: 5, fail: 2 },
    { week: 6, total: 17, success: 4, fail: 3 },
    { week: 7, total: 16, success: 4, fail: 3 },
    { week: 8, total: 22, success: 6, fail: 2 },
    { week: 9, total: 22, success: 6, fail: 2 },
    { week: 10, total: 18, success: 3, fail: 5 },
  ],
  members: [
    { name: "안혜린", weekly: [0, 0, 5, 4, 4, 1, 5, 4, 4, 5], total: 32, success: 7 },
    { name: "남혜민", weekly: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], total: 30, success: 10 },
    { name: "이예솔", weekly: [4, 4, 2, 2, 2, 4, 2, 4, 3, 3], total: 30, success: 6 },
    { name: "박창현", weekly: [3, 3, 3, 3, 3, 3, 3, 3, 3, 1], total: 28, success: 9 },
    { name: "부혜선", weekly: [3, 3, 3, 3, 3, 2, 3, 3, 3, 2], total: 28, success: 8 },
    { name: "김태홍", weekly: [3, 3, 3, 3, 3, 1, 0, 1, 2, 0], total: 19, success: 5 },
    { name: "김민경", weekly: [3, 0, 3, 3, 2, 3, 0, 0, 1, 2], total: 17, success: 4 },
    {
      name: "이준혁",
      weekly: ["NA", "NA", "NA", "NA", "NA", "NA", "NA", 4, 3, 2],
      total: 9,
      success: 2,
      joinWeek: 8,
    },
  ],
  honors: [
    {
      rank: "★ MVP · 완벽 개근",
      name: "남혜민",
      big: "10/10",
      detail: "총 30회",
      gold: true,
    },
    {
      rank: "★ 최다상 · 최다 인증",
      name: "안혜린",
      big: "32회",
      detail: "7주 성공",
    },
    {
      rank: "★ 꾸준상 · 8주 이상",
      name: "박창현 · 부혜선",
      big: "8/10↑",
      detail: "9주 · 8주 성공",
    },
  ],
  footer: {
    lead: "주 3회 외국어 학습 챌린지",
    highlight: "총 193회 인증 완료",
    tail: "10주간 수고하셨습니다 📚",
  },
};
