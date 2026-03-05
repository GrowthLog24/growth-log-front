import {
  HeroWrapper,
  IntroSection,
  CommunityBlogWrapper,
  MemberTestimonialSection,
  RoleMarqueeSection,
} from "@/presentation/components/sections";

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
