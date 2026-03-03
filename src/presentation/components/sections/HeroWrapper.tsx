import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { HeroSection } from "./HeroSection";
import type { RecruitmentStatus } from "@/domain/entities";

// Fallback 값 - Firestore 데이터가 없을 때 사용
const FALLBACK_GENERATION = 1;

/**
 * Hero 서버 래퍼 컴포넌트
 * Firestore에서 모집 정보를 가져와 클라이언트 컴포넌트에 전달
 */
export async function HeroWrapper() {
  const siteConfig = await siteConfigRepository.getSiteConfig();

  const generation = siteConfig?.recruitmentGeneration ?? FALLBACK_GENERATION;
  const recruitmentStatus: RecruitmentStatus = siteConfig?.isRecruitmentOpen ? "OPEN" : "CLOSED";

  return (
    <HeroSection
      generation={generation}
      recruitmentStatus={recruitmentStatus}
    />
  );
}
