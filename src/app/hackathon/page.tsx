import type { Metadata } from "next";
import { HackathonSubmitClient } from "@/presentation/components/hackathon/submit/HackathonSubmitClient";

export const metadata: Metadata = {
  title: { absolute: "100분 해커톤 제출 | Growth Log" },
  description: "그로스로그 6기 100분 해커톤 팀 결과물 제출",
  robots: { index: false, follow: false },
};

/**
 * 100분 해커톤 팀 제출 페이지 (/hackathon).
 * 행사 설정은 클라이언트에서 실시간 구독하므로 서버에서는 셸만 렌더링합니다.
 */
export default function HackathonSubmitPage() {
  return (
    <main className="flex-1">
      <HackathonSubmitClient />
    </main>
  );
}
