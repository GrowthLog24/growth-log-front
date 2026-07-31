import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";
import { monthlyScheduleRepository } from "@/infrastructure/repositories/monthlyScheduleRepository";
import { statsRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import {
  AboutMotionHero,
  AboutViewportMotion,
  GrowthTracksRail,
  InteractiveValues,
  StatsSection,
} from "@/presentation/components/about";

export const metadata: Metadata = {
  title: "About Us",
  description: "그로스로그를 소개합니다. AI와 함께 성장하는 개발 커뮤니티입니다.",
};

/** 추후 방침따라 수정  **/
export const dynamic = "force-dynamic";

/** 컨셉 전환 - 기존 회원에게 "뿌리는 유지된다"를 보여주는 대비 블록 */
const SHIFT = {
  asIs: {
    title: "KNOU CS 교내 개발자 커뮤니티",
    description: "방송대 전공생 중심의 스터디 모임",
  },
  toBe: {
    title: "AI와 함께 성장하는 개발 커뮤니티",
    description: "전공·직군 무관, AI를 동료로 삼는 성장 커뮤니티",
  },
} as const;

/**
 * 월별 일정 라벨
 */
const PHASE_LABELS: Record<number, string> = {
  0: "0개월차 프로그램",
  1: "1개월차 프로그램",
  2: "2개월차 프로그램",
  3: "3개월차 프로그램",
  4: "4개월차 프로그램",
  5: "5개월차 프로그램",
  6: "6개월차 프로그램",
  7: "매월 소모임 프로그램",
};

export default async function AboutUsPage() {
  // Firestore에서 데이터 가져오기
  const [schedules, stats, siteConfig] = await Promise.all([
    monthlyScheduleRepository.getSchedules(),
    statsRepository.getStats(),
    siteConfigRepository.getSiteConfig(),
  ]);

  const currentGeneration = siteConfig?.currentGeneration || 5;

  // 통계 데이터 구성 (숫자 타입으로 전달하여 애니메이션 적용)
  // 운영 기간과 누적 기수는 현재 기수에서 자동 계산 (관리자 페이지와 동일한 로직)
  // 운영 기간: 1기당 6개월이므로 올림 처리 (5기 = 2.5년 = 3년차)
  const statsItems = [
    { label: "운영 기간", value: Math.ceil(currentGeneration / 2), suffix: "년차" },
    { label: "현재 활동 회원", value: stats?.activeMembers || 0, suffix: "명" },
    { label: "프로젝트", value: stats?.projectsCount || 0, suffix: "개" },
    { label: "누적 기수", value: currentGeneration, suffix: "기" },
    { label: "누적 멤버", value: stats?.totalMembers || 0, suffix: "명" },
    { label: "성장일지 발행", value: stats?.growthPostsCount || 0, suffix: "+" },
  ];

  return (
    <div data-about-motion-page>
      {/* Hero Section */}
      <AboutMotionHero />

      <div className="about-sam-zone">
      {/* Our Shift - AS-IS → TO-BE */}
      <section className="relative overflow-hidden bg-[#f3f4f1] text-foreground">
        <div className="container-custom">
          <div className="about-six-grid">
            <span className="text-xs font-bold tracking-[0.2em] text-primary md:col-start-1">
              OUR SHIFT
            </span>

            <h2 className="sam-statement-title mt-7 md:col-span-3 md:col-start-1 md:row-start-2">
              <span className="block text-gray-3">교내 커뮤니티에서</span>
              <span className="block text-foreground">
                AI-Native 커뮤니티로
              </span>
            </h2>

            <p className="shift-description mt-8 max-w-2xl text-muted-foreground md:col-span-3 md:col-start-4 md:row-start-2 md:mt-7">
              <span className="block">
                Growth Log는 KNOU 컴퓨터과학과에서 시작했습니다.
              </span>
              <span className="block">
                그 뿌리는 그대로 KNOU CS 트랙으로 이어가되,
              </span>
              <span className="block">
                이제는 전공과 소속을 넘어{" "}
                <strong className="font-semibold text-foreground">
                  &lsquo;AI와 함께 성장하려는 모든 개발자&rsquo;
                </strong>
                에게 문을 엽니다.
              </span>
            </p>

            <div className="mt-10 md:col-span-3 md:col-start-1 md:row-start-3 md:mt-14 md:pr-8">
              <span className="font-montserrat text-[10px] font-medium tracking-[0.12em] text-gray-2">
                AS-IS
              </span>
              <h3 className="mt-4 max-w-md text-xl font-medium leading-[1.35] tracking-[-0.04em] text-gray-1 md:text-2xl">
                {SHIFT.asIs.title}
              </h3>
              <p className="mt-2 max-w-md text-sm font-light leading-[1.6] tracking-[-0.035em] text-gray-2 md:text-base">
                {SHIFT.asIs.description}
              </p>
            </div>
            <div className="mt-8 md:col-span-3 md:col-start-4 md:row-start-3 md:mt-14 md:pl-4">
              <span className="font-montserrat text-[10px] font-medium tracking-[0.12em] text-primary">
                TO-BE
              </span>
              <h3 className="mt-4 max-w-lg text-xl font-medium leading-[1.35] tracking-[-0.04em] md:text-2xl">
                {SHIFT.toBe.title}
              </h3>
              <p className="mt-2 max-w-lg text-sm font-light leading-[1.6] tracking-[-0.035em] text-muted-foreground md:text-base">
                {SHIFT.toBe.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="values-section bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-6 md:gap-6 lg:gap-8">
            <h2 className="sam-statement-title max-w-4xl text-foreground md:col-span-3 md:col-start-1">
              우리가 믿는 세 가지
            </h2>
          </div>

          <InteractiveValues />
        </div>
      </section>

      {/* How we grow */}
      <section className="overflow-hidden bg-gray-black text-white">
        <div className="container-custom">
          <div className="about-six-grid mb-9 md:mb-11">
            <div className="md:col-span-4 md:col-start-1">
            <span className="font-montserrat text-[11px] font-medium tracking-[0.08em] text-green-7">
              HOW WE GROW
            </span>
            <h2 className="mt-6 text-[2.5rem] font-medium leading-[1.3] tracking-[-0.045em] text-white md:text-[3.5rem]">
              Growth Log에서 이렇게 성장합니다
            </h2>
            </div>
          </div>

          <GrowthTracksRail />

          <div className="mt-8 md:mt-10">
            <Button asChild size="lg" className="text-base">
              <Link href="/recruit">
                {currentGeneration + 1}기 멤버로 함께하기
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 md:mb-10 xl:grid-cols-4">
            <div className="md:col-span-1 xl:col-span-2">
              <span className="font-montserrat text-xs font-medium text-primary">
                {currentGeneration}TH GENERATION ROADMAP
              </span>
              <h2 className="mt-4 text-foreground">
                {currentGeneration}기 월별 일정 소개
              </h2>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {schedules.map((schedule) => {
              // 월을 개별 배지로 분리 (예: "2월, 8월" → ["2월", "8월"])
              const monthBadges = schedule.months.split(",").map((m) => m.trim());

              return (
                <article
                  key={schedule.phase}
                  className="group flex min-h-60 flex-col rounded-[24px] bg-background px-6 py-7 transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white md:px-7 md:py-8"
                >
                  <div className="mb-8 flex flex-wrap items-center gap-x-2 text-primary">
                    {monthBadges.map((month, idx) => (
                      <span
                        key={idx}
                        className="font-montserrat text-xs font-medium tracking-[-0.01em]"
                      >
                        {month}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto">
                    <h3 className="mb-3 font-semibold text-foreground">
                      {PHASE_LABELS[schedule.phase]}
                    </h3>
                    {schedule.activities.length > 0 ? (
                      <ul className="space-y-1.5">
                        {schedule.activities.map((activity, index) => (
                          <li
                            key={index}
                            className="text-sm leading-relaxed text-muted-foreground transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
                            style={{ transitionDelay: `${index * 35}ms` }}
                          >
                            {activity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground/50">
                        활동 내용이 없습니다.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection stats={statsItems} />

      {/* Team Photo Section */}
      <section className="section-padding bg-[#f5f8f4]">
        <div className="container-custom">
          <div className="about-six-grid">
          <div className="relative aspect-[16/9] overflow-hidden md:col-span-5 md:col-start-2 md:aspect-[21/9]">
            <Image
              src={getStorageUrl(STORAGE_PATHS.TEAM_PHOTO)}
              alt="그로스로그 단체사진"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-sm opacity-80">그로스로그 {currentGeneration}기</p>
              <h3 className="text-2xl font-bold">함께 성장하는 우리</h3>
            </div>
          </div>
          </div>
        </div>
      </section>
      </div>
      <AboutViewportMotion />
    </div>
  );
}
