import type { Metadata } from "next";
import { HackathonLiveDashboard } from "@/presentation/components/hackathon/live/HackathonLiveDashboard";

export const metadata: Metadata = {
  title: { absolute: "100분 해커톤 라이브 | Growth Log" },
  robots: { index: false, follow: false },
};

/**
 * 100분 해커톤 빔 프로젝터용 실시간 대시보드 (사이트 Header/Footer 없음).
 */
export default function HackathonLivePage() {
  return <HackathonLiveDashboard />;
}
