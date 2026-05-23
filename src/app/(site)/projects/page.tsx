import type { Metadata } from "next";
import { awardRepository } from "@/infrastructure/repositories/awardRepository";
import { projectRepository } from "@/infrastructure/repositories/projectRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { serializeFirestoreData } from "@/shared/utils/serialize";
import { ProjectScheduleSection } from "./components/ProjectScheduleSection";
import { AwardsSection } from "./components/AwardsSection";
import { ProjectsSection } from "./components/ProjectsSection";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "그로스로그의 프로젝트와 수상 내역을 확인하세요. 팀 프로젝트, 대회 수상 등 다양한 성과를 소개합니다.",
};

/** 매 요청마다 최신 데이터 조회 */
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  // 수상 내역, 프로젝트 목록, 사이트 설정을 병렬로 가져오기
  const [awards, projects, siteConfig] = await Promise.all([
    awardRepository.getActiveAwards(),
    projectRepository.getActiveProjects(),
    siteConfigRepository.getSiteConfig(),
  ]);

  // 참여 신청 CTA 링크 (헤더 CTA와 동일하게 siteConfig의 구글폼 링크 사용)
  const applyLink = siteConfig?.primaryCtaLink ?? "";

  // 수상한 프로젝트 ID Set 생성
  const awardedProjectIds = new Set(
    awards.filter((a) => a.projectId).map((a) => a.projectId)
  );

  // Timestamp를 직렬화하여 Client Component에 전달
  const serializedAwards = serializeFirestoreData(awards);
  const serializedProjects = serializeFirestoreData(projects);

  return (
    <>
      {/* Project Schedule Section - 최상단 (5기 프로젝트 일정) */}
      <ProjectScheduleSection applyLink={applyLink} />

      {/* Awards Section - 상단 */}
      <AwardsSection awards={serializedAwards} />

      {/* Projects Section - 하단 */}
      <ProjectsSection
        projects={serializedProjects}
        awardedProjectIds={Array.from(awardedProjectIds)}
      />
    </>
  );
}
