import {
  siteConfigRepository,
  statsRepository,
} from "@/infrastructure/repositories/siteConfigRepository";
import { HeroSection } from "./HeroSection";
import type { RecruitmentStatus, CtaMode } from "@/domain/entities";

// Fallback 값 - Firestore 데이터가 없을 때 사용
const FALLBACK_GENERATION = 1;

/** 활동 트랙 수 (Dev×AI · KNOU CS · Project · 성장일지 · 클럽 · Support) */
const TRACK_COUNT = 6;

/**
 * Hero 서버 래퍼 컴포넌트
 * Firestore에서 모집 정보를 가져와 클라이언트 컴포넌트에 전달
 */
export async function HeroWrapper() {
  const [siteConfig, stats] = await Promise.all([
    siteConfigRepository.getSiteConfig(),
    statsRepository.getStats(),
  ]);

  const isRecruiting = siteConfig?.isRecruitmentOpen ?? false;
  const recruitmentStatus: RecruitmentStatus = isRecruiting ? "OPEN" : "CLOSED";

  // 모집 중: recruitmentGeneration 사용 (예: 6기 지원하기)
  // 모집 종료: currentGeneration 사용 (사전등록은 currentGeneration + 1)
  const generation = isRecruiting
    ? (siteConfig?.recruitmentGeneration ?? FALLBACK_GENERATION)
    : (siteConfig?.currentGeneration ?? FALLBACK_GENERATION);

  // CTA 설정 구성
  const ctaConfig = {
    mode: (siteConfig?.ctaMode ?? "auto") as CtaMode,
    primaryText: siteConfig?.primaryCtaText,
    primaryLink: siteConfig?.primaryCtaLink,
    secondaryText: siteConfig?.secondaryCtaText,
    secondaryLink: siteConfig?.secondaryCtaLink,
  };

  // 히어로 지표 - 커뮤니티 규모를 첫 화면에서 바로 보여줍니다
  const currentGeneration = siteConfig?.currentGeneration ?? FALLBACK_GENERATION;
  const heroStats = [
    { value: `${currentGeneration}기+`, label: "운영 기수" },
    { value: `${stats?.totalMembers ?? 0}+`, label: "누적 멤버" },
    { value: `${TRACK_COUNT}`, label: "활동 트랙" },
  ];

  return (
    <HeroSection
      generation={generation}
      recruitmentStatus={recruitmentStatus}
      ctaConfig={ctaConfig}
      stats={heroStats}
    />
  );
}
