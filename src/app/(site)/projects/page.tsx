import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, CircleDollarSign, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    "배움을 결과물로, 결과물을 기회로. 월간 프로젝트부터 수익화, SW 경진대회까지 그로스로그의 프로젝트 트랙을 소개합니다.",
};

/** 컨셉 전환 - 대회 단일 트랙에서 목적별 다중 트랙으로 */
const SHIFT = {
  asIs: {
    title: "SW 경진대회 출전 중심",
    description: "대회 참가에 포커싱된 단발성 프로젝트",
  },
  toBe: {
    title: "월간 · 수익화 · 대회, 다양한 트랙",
    description: "규모와 목적에 맞게 골라 도전",
  },
} as const;

/** 세 갈래의 프로젝트 */
const PROJECT_TRACKS = [
  {
    icon: Calendar,
    title: "월간 프로젝트",
    description: "한 달 단위로 빠르게 만들고 배포하는 미니 프로덕트. AI 활용 필수.",
  },
  {
    icon: CircleDollarSign,
    title: "수익화 프로젝트",
    description: "실제 매출을 목표로 하는 사이드 프로젝트. 결제·마케팅까지 실험.",
  },
  {
    icon: Trophy,
    title: "SW 경진대회",
    description: "기존처럼 대회 출전 팀도 지원. KNOU CS 트랙과 연계.",
  },
] as const;

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
      {/* Hero */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            PROJECT
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            배움을 결과물로,
            <br />
            결과물을 기회로
          </h1>
          <p className="mt-5 text-muted-foreground max-w-2xl">
            SW 경진대회를 넘어 — 월간 단위 프로젝트와{" "}
            <strong className="font-semibold text-foreground">수익화 가능한 프로덕트</strong>까지,
            프로젝트의 범위를 확장합니다.
          </p>
        </div>
      </section>

      {/* Expansion - AS-IS → TO-BE */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
            <div className="rounded-xl border border-border p-5">
              <span className="text-xs font-bold tracking-wider text-muted-foreground">AS-IS</span>
              <h3 className="mt-2 font-semibold text-foreground">{SHIFT.asIs.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{SHIFT.asIs.description}</p>
            </div>

            <div className="py-3 text-center text-sm text-muted-foreground" aria-hidden="true">
              ↓ 범위 확장
            </div>

            <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
              <span className="text-xs font-bold tracking-wider text-primary">TO-BE</span>
              <h3 className="mt-2 font-semibold text-foreground">{SHIFT.toBe.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{SHIFT.toBe.description}</p>
            </div>
          </div>

          <div>
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              EXPANSION
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
              이제 프로젝트는
              <br />
              더 넓어집니다
            </h2>
            <p className="mt-5 text-muted-foreground">
              &ldquo;대회를 위한 프로젝트&rdquo;에서 &ldquo;성장과 수익을 위한 프로젝트&rdquo;로.
              짧게는 한 달, 길게는 한 기수 동안 실제 사용자에게 닿는 프로덕트를 만듭니다.
            </p>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              TRACKS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">세 갈래의 프로젝트</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROJECT_TRACKS.map((track) => (
              <div
                key={track.title}
                className="rounded-2xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <track.icon className="h-6 w-6 text-primary" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{track.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{track.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Schedule Section - 5기 프로젝트 일정 */}
      <ProjectScheduleSection applyLink={applyLink} />

      {/* Awards Section - 상단 */}
      <AwardsSection awards={serializedAwards} />

      {/* Projects Section - 하단 */}
      <ProjectsSection
        projects={serializedProjects}
        awardedProjectIds={Array.from(awardedProjectIds)}
      />

      {/* CTA */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="rounded-3xl bg-primary px-8 py-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              아이디어만 있고 팀이 없다면
            </h2>
            <p className="mt-3 text-white/85">
              그로스로그에서 팀을 만나고, AI와 함께 완성하세요.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 text-base bg-white text-primary hover:bg-white/90"
            >
              <Link href="/recruit">프로젝트 멤버 되기</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
