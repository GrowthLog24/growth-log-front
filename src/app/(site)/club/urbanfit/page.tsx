import type { Metadata } from "next";
import { ChallengeDashboard } from "../_shared/ChallengeDashboard";
import { urbanfit } from "./data";

export const metadata: Metadata = {
  title: "어반핏 · 주 3회 운동 챌린지 10주 결산",
  description:
    "어반핏 주 3회 운동 챌린지 10주간의 결산 리포트. 멤버별 인증 기록, 주차별 결산, 명예의 전당을 확인하세요.",
};

export default function UrbanfitClubPage() {
  return <ChallengeDashboard {...urbanfit} />;
}
