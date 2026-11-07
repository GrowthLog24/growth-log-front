import type { Metadata } from "next";
import { VoteApp } from "@/presentation/components/hackathon/vote/VoteApp";

export const metadata: Metadata = {
  title: { absolute: "휴먼 인정상 투표 | Growth Log" },
  description: "Growth Log 100분 해커톤 휴먼 인정상 투표",
  robots: { index: false, follow: false },
};

/**
 * 휴먼 인정상 투표 페이지. 프로젝터 QR로 접속하는 모바일 우선 화면입니다.
 *
 * @returns {JSX.Element} 투표 페이지
 */
export default function HackathonVotePage() {
  return <VoteApp />;
}
