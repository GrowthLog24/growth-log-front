"use client";

import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/presentation/components/common/TrackedLink";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";
import type { RecruitmentStatus, CtaMode } from "@/domain/entities";

interface CtaConfig {
  mode: CtaMode;
  primaryText?: string;
  primaryLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
}

interface HeroStat {
  /** 표시값 (예: "5기+") */
  value: string;
  /** 지표명 (예: "운영 기수") */
  label: string;
}

interface HeroSectionProps {
  generation: number;
  recruitmentStatus: RecruitmentStatus;
  ctaConfig?: CtaConfig;
  stats?: HeroStat[];
}

export function HeroSection({
  generation,
  recruitmentStatus,
  ctaConfig,
  stats,
}: HeroSectionProps) {
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
  const primaryCtaType = primaryCta.link.includes("/pre-register")
    ? "pre_registration"
    : primaryCta.link.includes("/recruit") || isRecruiting
      ? "membership_application"
      : "primary_action";
  const primaryCtaGeneration =
    primaryCtaType === "pre_registration" ? nextGeneration : generation;

  return (
    <section className="group relative w-full h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 bg-gray-black">
        {/* 기본 오버레이 - 영상이 잘 보이도록 옅게 */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-gray-black/50 to-transparent to-25%" />
        {/* 호버 오버레이 - 카피가 뜰 때만 어둡게 (터치 기기는 hover가 없어 항상 적용) */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-gray-black/80 to-gray-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [@media(hover:none)]:opacity-100" />
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

      {/* Content - 마우스를 올리면 노출 (터치 기기는 hover가 없어 항상 노출) */}
      <div className="relative z-20 container-custom h-full flex flex-col justify-center opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0">
        <div className="max-w-2xl">
          <span className="inline-block px-4 py-1.5 mb-5 rounded-full bg-white/15 text-sm font-medium text-white backdrop-blur-sm">
            AI-Native Developer Community
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            AI와 함께
            <br />
            성장하는 개발 커뮤니티
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-xl">
            코드만 짜는 시대는 끝났습니다. 그로스로그는 AI를 도구가 아닌 동료로 삼아,
            함께 배우고 만들고 성장하는 개발자들의 커뮤니티입니다.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="text-base">
              <TrackedLink
                href={primaryCta.link}
                eventName="cta_click"
                eventParams={{
                  cta_type: primaryCtaType,
                  cta_location: "home_hero",
                  generation: primaryCtaGeneration,
                }}
              >
                {primaryCta.text}
              </TrackedLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base bg-transparent text-white border-white hover:bg-white hover:text-gray-black"
            >
              <TrackedLink
                href={secondaryCta.link}
                eventName="cta_click"
                eventParams={{
                  cta_type: "secondary_action",
                  cta_location: "home_hero",
                }}
              >
                {secondaryCta.text}
              </TrackedLink>
            </Button>
          </div>

          {stats && stats.length > 0 && (
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-2xl md:text-3xl font-bold text-white tabular-nums">
                    {stat.value}
                  </dd>
                  <p className="mt-1 text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* 호버 힌트 - 카피가 뜨기 전에만 보임 (터치 기기에서는 숨김) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-500 group-hover:opacity-0 [@media(hover:none)]:hidden">
        <div className="flex flex-col items-center text-white/60">
          <svg
            className="w-6 h-6 mb-2 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
