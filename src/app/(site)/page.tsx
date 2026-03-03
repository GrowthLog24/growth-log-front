import {
  HeroWrapper,
  IntroSection,
  ActivityPreviewWrapper,
  MemberTestimonialSection,
  RoleMarqueeSection,
} from "@/presentation/components/sections";

export default function Home() {
  return (
    <>
      <HeroWrapper />
      <IntroSection />
      <ActivityPreviewWrapper />
      <MemberTestimonialSection />
      <RoleMarqueeSection />
    </>
  );
}
