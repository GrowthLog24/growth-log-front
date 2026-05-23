"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";
import type { RecruitmentStatus, CtaMode } from "@/domain/entities";

interface CtaConfig {
  mode: CtaMode;
  primaryText?: string;
  primaryLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
}

interface HeroSectionProps {
  generation: number;
  recruitmentStatus: RecruitmentStatus;
  ctaConfig?: CtaConfig;
}

export function HeroSection({ generation, recruitmentStatus, ctaConfig }: HeroSectionProps) {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoUrl = getStorageUrl(STORAGE_PATHS.HERO_BG_VIDEO);

  const isRecruiting = recruitmentStatus === "OPEN";
  const nextGeneration = generation + 1;

  // CTA 텍스트/링크 결정
  const getPrimaryCta = () => {
    // 수동 모드이고 설정이 있으면 사용
    if (ctaConfig?.mode === "manual" && ctaConfig.primaryText && ctaConfig.primaryLink) {
      return { text: ctaConfig.primaryText, link: ctaConfig.primaryLink };
    }
    // 자동 모드 또는 설정 없음
    if (isRecruiting) {
      return { text: `${generation}기 지원하기`, link: "/recruit" };
    }
    return { text: `${nextGeneration}기 사전등록하기`, link: "/pre-register" };
  };

  const getSecondaryCta = () => {
    // 수동 모드이고 설정이 있으면 사용
    if (ctaConfig?.mode === "manual" && ctaConfig.secondaryText && ctaConfig.secondaryLink) {
      return { text: ctaConfig.secondaryText, link: ctaConfig.secondaryLink };
    }
    // 기본값
    return { text: "더 알아보기", link: "/about-us" };
  };

  const primaryCta = getPrimaryCta();
  const secondaryCta = getSecondaryCta();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    if (!isContentVisible) {
      // 콘텐츠가 보이지 않을 때: 하단 30% 영역에서 트리거
      const triggerHeight = rect.height * 0.7;
      if (mouseY > triggerHeight) {
        setIsContentVisible(true);
      }
    } else {
      // 콘텐츠가 보일 때: 상단 절반 영역으로 가면 숨김
      const hideThreshold = rect.height * 0.5;
      if (mouseY < hideThreshold) {
        setIsContentVisible(false);
      }
    }
  };

  const handleMouseLeave = () => {
    // 영상 영역을 완전히 벗어나면 콘텐츠 숨김
    setIsContentVisible(false);
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[600px] md:h-[700px] overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Video */}
      <div className="absolute inset-0 bg-gray-black">
        {/* Overlay - 하단 1/4 그라데이션으로 섹션 구분, 콘텐츠 표시 시 더 어두워짐 */}
        <div
          className={`absolute inset-0 z-10 transition-all duration-500 ${
            isContentVisible
              ? "bg-gradient-to-t from-gray-black/80 to-gray-black/40"
              : "bg-gradient-to-t from-gray-black/50 to-transparent to-25%"
          }`}
        />
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      </div>

      {/* Content - 하단 호버 후 표시, 영역 벗어나면 숨김 */}
      <div
        className={`relative z-20 container-custom h-full flex flex-col justify-center transition-all duration-500 ${
          isContentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            함께 성장하는
            <br />
            IT 커뮤니티
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-lg">
            다양한 분야에 종사하는 멤버들과 함께하며 새로운 인사이트를 얻어가세요.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="text-base">
              <Link href={primaryCta.link}>{primaryCta.text}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base bg-transparent text-white border-white hover:bg-white hover:text-gray-black"
            >
              <Link href={secondaryCta.link}>{secondaryCta.text}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 호버 힌트 - 하단 중앙, 콘텐츠 표시 전에만 보임 */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ${
          isContentVisible ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col items-center text-white/60">
          <svg
            className="w-6 h-6 mb-2 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          <span className="text-sm">마우스를 올려보세요</span>
        </div>
      </div>
    </section>
  );
}
