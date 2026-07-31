"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function AboutMotionHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const artwork = artworkRef.current;
    if (!section || !artwork) return;

    let animationFrame = 0;

    const updateArtwork = () => {
      const rect = section.getBoundingClientRect();
      const distance =
        (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const offset = Math.max(-90, Math.min(90, distance * -82));
      const rotation = Math.max(-3.5, Math.min(3.5, distance * -3.2));
      const scale = 1 + Math.min(Math.abs(distance) * 0.035, 0.035);

      artwork.style.transform = `translate3d(0, ${offset}px, 0) rotate(${rotation}deg) scale(${scale})`;
      animationFrame = 0;
    };

    const requestFrame = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(updateArtwork);
    };

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    requestFrame();

    return () => {
      window.removeEventListener("scroll", requestFrame);
      window.removeEventListener("resize", requestFrame);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-motion-skip
      className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[#080808] text-white"
    >
      <div
        ref={artworkRef}
        className="absolute inset-y-0 right-[-18%] w-[92%] will-change-transform md:right-[-7%] md:w-[65%]"
        aria-hidden="true"
      >
        <Image
          src="/images/about/growth-log-symbol-3d.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 92vw, 65vw"
          className="object-contain"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/55 to-[#0a0a0a]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/65 via-transparent to-[#0a0a0a]/25" />

      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] w-full flex-col justify-between px-4 pb-10 pt-[50px] md:px-8 md:pt-[60px]">
        <span className="about-hero-reveal font-montserrat text-xs font-medium tracking-normal text-white/65 md:text-sm">
          ABOUT GROWTH LOG
        </span>

        <h1 className="max-w-[12.5em] text-[clamp(42px,7.2vw,108px)] font-medium leading-[1.12] tracking-[-0.025em] max-[809px]:leading-[1.2]">
          <span className="about-hero-line block">AI와 함께 성장하는</span>
          <span className="about-hero-line block text-white/45">개발 커뮤니티,</span>
          <span className="about-hero-line block">
            <span className="font-montserrat font-medium tracking-[-0.025em]">
              Growth <em className="font-medium not-italic text-primary">Log</em>
            </span>
          </span>
        </h1>

        <div className="about-hero-reveal about-hero-reveal-delay grid gap-7 md:grid-cols-2 md:items-end">
          <span className="font-montserrat hidden text-xs font-medium tracking-normal text-white/50 md:block">
            SCROLL TO GROW ↓
          </span>
          <p className="max-w-2xl text-sm font-normal leading-[1.5] tracking-[-0.02em] text-white/85 md:text-base lg:text-lg">
            우리는 더 이상 &lsquo;방통대 교내 개발자 모임&rsquo;에 머무르지 않습니다. AI 시대에 맞게,
            배움의 방식을 다시 씁니다.
          </p>
        </div>
      </div>
    </section>
  );
}
