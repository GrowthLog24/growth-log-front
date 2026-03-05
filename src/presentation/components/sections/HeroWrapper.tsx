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

  const isRecruiting = siteConfig?.isRecruitmentOpen ?? false;
  const recruitmentStatus: RecruitmentStatus = isRecruiting ? "OPEN" : "CLOSED";

  // 모집 중: recruitmentGeneration 사용 (예: 6기 지원하기)
  // 모집 종료: currentGeneration 사용 (사전등록은 currentGeneration + 1)
  const generation = isRecruiting
    ? (siteConfig?.recruitmentGeneration ?? FALLBACK_GENERATION)
    : (siteConfig?.currentGeneration ?? FALLBACK_GENERATION);

  return (
    <HeroSection
      generation={generation}
      recruitmentStatus={recruitmentStatus}
    />
  );
}
