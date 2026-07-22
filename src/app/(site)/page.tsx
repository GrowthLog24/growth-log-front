import {
  HeroWrapper,
  IntroSection,
  CommunityBlogWrapper,
  MemberTestimonialSection,
  RoleMarqueeSection,
} from "@/presentation/components/sections";

/** 매 요청마다 최신 데이터 조회 (인덱스 안정화 후 revalidate = 3600으로 전환) */
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <HeroWrapper />
      <IntroSection />
      <CommunityBlogWrapper />
      <MemberTestimonialSection />
      <RoleMarqueeSection />
    </>
  );
}
