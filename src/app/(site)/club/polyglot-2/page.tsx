import type { Metadata } from "next";
import { ChallengeDashboard } from "../_shared/ChallengeDashboard";
import { polyglot2 } from "./data";

export const metadata: Metadata = {
  title: "폴리글랏 2기 · 주 3회 외국어 학습 챌린지 10주 최종 결산",
  description:
    "폴리글랏 주 3회 외국어 학습 챌린지 2기 10주간의 최종 결산 리포트. 멤버별 인증 기록, 주차별 결산, 명예의 전당을 확인하세요.",
};

export default function PolyglotSeason2ClubPage() {
  return <ChallengeDashboard {...polyglot2} />;
}
