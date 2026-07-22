/** 클럽 챌린지 대시보드 공용 타입 */

export type WeeklyValue = number | "NA";

export interface Member {
  name: string;
  weekly: WeeklyValue[];
  total: number;
  success: number;
  joinWeek?: number;
}

export interface WeekStat {
  week: number;
  total: number;
  success: number;
  fail: number;
}

export interface Kpi {
  label: string;
  value: string;
  unit: string;
  sub: string;
  featured?: boolean;
}

export interface Honor {
  rank: string;
  name: string;
  big: string;
  detail: string;
  gold?: boolean;
}

export interface ChallengeMeta {
  eyebrow: string;
  title: string;
  titleAccent: string;
  meta: string;
  totalWeeks: number;
}

export interface ChallengeFooter {
  lead: string;
  highlight: string;
  tail: string;
}

export interface ChallengeData {
  meta: ChallengeMeta;
  kpis: Kpi[];
  weekStats: WeekStat[];
  members: Member[];
  honors: Honor[];
  footer: ChallengeFooter;
}
