import type { ChallengeData } from "../_shared/types";

/** 어반핏 · 주 3회 운동 챌린지 10주 결산 데이터 (Python 집계 결과) */
export const urbanfit: ChallengeData = {
  meta: {
    eyebrow: "Urbanfit Challenge · Season Report",
    title: "주 3회 운동 챌린지",
    titleAccent: "10주 결산",
    meta: "10 WEEKS / 14 MEMBERS",
    totalWeeks: 10,
  },
  kpis: [
    {
      label: "Total Check-ins",
      value: "302",
      unit: "회",
      sub: "목표 300회 달성 ✓",
      featured: true,
    },
    { label: "참가 인원", value: "14", unit: "명", sub: "중간 합류 1명 포함" },
    { label: "주차당 평균 인증", value: "30.2", unit: "회", sub: "10주 평균" },
    {
      label: "개근(주 3회 완수) 멤버",
      value: "2",
      unit: "명",
      sub: "남혜민, 부혜선",
    },
  ],
  weekStats: [
    { week: 1, total: 31, success: 8, fail: 5 },
    { week: 2, total: 37, success: 9, fail: 4 },
    { week: 3, total: 32, success: 8, fail: 5 },
    { week: 4, total: 36, success: 9, fail: 4 },
    { week: 5, total: 25, success: 5, fail: 8 },
    { week: 6, total: 26, success: 6, fail: 5 },
    { week: 7, total: 35, success: 8, fail: 5 },
    { week: 8, total: 32, success: 8, fail: 6 },
    { week: 9, total: 25, success: 7, fail: 3 },
    { week: 10, total: 23, success: 5, fail: 4 },
  ],
  members: [
    { name: "부혜선", weekly: [3, 4, 4, 3, 3, 3, 3, 3, 3, 4], total: 33, success: 10 },
    { name: "남혜민", weekly: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], total: 30, success: 10 },
    { name: "박예승", weekly: [5, 4, 3, 5, 1, 3, 3, 1, 3, 1], total: 29, success: 7 },
    { name: "이준혁", weekly: [0, 2, 4, 3, 3, 3, 4, 3, 3, 4], total: 29, success: 8 },
    { name: "김태홍", weekly: [3, 3, 3, 3, 3, 2, 3, 3, 3, 2], total: 28, success: 8 },
    { name: "이예솔", weekly: [4, 3, 3, 3, 2, 4, 2, 3, 1, 0], total: 25, success: 6 },
    { name: "안혜린", weekly: [0, 3, 0, 3, 3, 1, 3, 2, 4, 4], total: 23, success: 6 },
    { name: "이동규", weekly: [3, 2, 3, 2, 2, 3, 3, 3, 1, 0], total: 22, success: 5 },
    { name: "이재인", weekly: [2, 5, 2, 2, 2, 1, 3, 2, 0, 1], total: 20, success: 2 },
    { name: "이지현", weekly: [3, 3, 2, 3, 1, 0, 2, 1, 0, 0], total: 15, success: 3 },
    { name: "엄수현", weekly: [1, 3, 3, 3, 0, 1, 2, 1, 0, 0], total: 14, success: 3 },
    { name: "서지영", weekly: [3, 1, 1, 2, 1, 0, 2, 3, 0, 0], total: 13, success: 2 },
    { name: "김민경", weekly: [1, 1, 1, 1, 1, 2, 2, 1, 1, 1], total: 12, success: 0 },
    {
      name: "김종진",
      weekly: ["NA", "NA", "NA", "NA", "NA", "NA", "NA", 3, 3, 3],
      total: 9,
      success: 3,
      joinWeek: 8,
    },
  ],
  honors: [
    {
      rank: "★ MVP · 완벽 개근",
      name: "부혜선",
      big: "10/10",
      detail: "총 33회",
      gold: true,
    },
    {
      rank: "★ RUNNER-UP · 개근",
      name: "남혜민",
      big: "10/10",
      detail: "총 30회",
    },
    {
      rank: "★ 꾸준상 · 8주 이상",
      name: "이준혁 · 김태홍",
      big: "8/10",
      detail: "각 8주 성공",
    },
  ],
  footer: {
    lead: "주 3회 운동 챌린지",
    highlight: "총 302회 인증 완료",
    tail: "10주간 수고하셨습니다 💪",
  },
};
