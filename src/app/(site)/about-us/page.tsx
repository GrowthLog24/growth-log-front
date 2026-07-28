import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Handshake,
  Zap,
  TrendingUp,
  Bot,
  GraduationCap,
  Wrench,
  NotebookPen,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";
import { monthlyScheduleRepository } from "@/infrastructure/repositories/monthlyScheduleRepository";
import { statsRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { StatsSection } from "@/presentation/components/about";

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

/** 우리가 믿는 세 가지 */
const VALUES = [
  {
    icon: Handshake,
    title: "Together",
    description: "혼자 빠르게보다 함께 멀리. 서로의 성장을 기록하고 응원합니다.",
  },
  {
    icon: Zap,
    title: "AI-Native",
    description: "AI를 두려워하지 않고 능숙하게. 도구가 아닌 페어로 씁니다.",
  },
  {
    icon: TrendingUp,
    title: "Real Growth",
    description: "인증샷용 활동이 아니라, 실제 결과물과 커리어로 이어지는 성장.",
  },
] as const;

/** Growth Log에서 성장하는 네 갈래 */
const GROWTH_TRACKS = [
  { icon: Bot, title: "Dev×AI", description: "AI 개발 특강 · 커리어 세미나", href: "/dev-ai" },
  { icon: GraduationCap, title: "KNOU CS", description: "전공 스터디 · 기출 CBT", href: "/knou-cs" },
  { icon: Wrench, title: "Project", description: "월간 · 수익화 프로젝트", href: "/projects" },
  { icon: NotebookPen, title: "Club", description: "성장일지 · 오프라인 네트워킹", href: "/activity" },
] as const;

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
    <>
      {/* Hero Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            ABOUT US
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            AI와 함께 성장하는
            <br />
            개발 커뮤니티, Growth Log
          </h1>
          <p className="mt-5 text-muted-foreground max-w-2xl">
            우리는 더 이상 &lsquo;방통대 교내 개발자 모임&rsquo;에 머무르지 않습니다. AI 시대에 맞게,
            배움의 방식을 다시 씁니다.
          </p>
        </div>
      </section>

      {/* Our Shift - AS-IS → TO-BE */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              OUR SHIFT
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
              교내 커뮤니티에서
              <br />
              AI-Native 커뮤니티로
            </h2>
            <p className="mt-5 text-muted-foreground">
              Growth Log는 KNOU 컴퓨터과학과에서 시작했습니다. 그 뿌리는 그대로 KNOU CS 트랙으로
              이어가되, 이제는 전공과 소속을 넘어{" "}
              <strong className="font-semibold text-foreground">
                &lsquo;AI와 함께 성장하려는 모든 개발자&rsquo;
              </strong>
              에게 문을 엽니다.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
            <div className="rounded-xl border border-border p-5">
              <span className="text-xs font-bold tracking-wider text-muted-foreground">AS-IS</span>
              <h3 className="mt-2 font-semibold text-foreground">{SHIFT.asIs.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{SHIFT.asIs.description}</p>
            </div>

            <div className="py-3 text-center text-xl text-muted-foreground" aria-hidden="true">
              ↓
            </div>

            <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
              <span className="text-xs font-bold tracking-wider text-primary">TO-BE</span>
              <h3 className="mt-2 font-semibold text-foreground">{SHIFT.toBe.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{SHIFT.toBe.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              VALUES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">우리가 믿는 세 가지</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we grow */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              HOW WE GROW
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Growth Log에서 이렇게 성장합니다
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GROWTH_TRACKS.map((track) => (
              <Link
                key={track.title}
                href={track.href}
                className="group rounded-2xl border border-border bg-white p-6 transition-colors hover:border-primary"
              >
                <track.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-bold text-foreground">{track.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{track.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
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
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              {currentGeneration}TH GENERATION ROADMAP
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {currentGeneration}기 월별 일정 소개
            </h2>
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {schedules.map((schedule) => {
              // 월을 개별 배지로 분리 (예: "2월, 8월" → ["2월", "8월"])
              const monthBadges = schedule.months.split(",").map((m) => m.trim());

              return (
                <div
                  key={schedule.phase}
                  className="bg-white rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {monthBadges.map((month, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded"
                      >
                        {month}
                      </span>
                    ))}
                  </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {PHASE_LABELS[schedule.phase]}
                </h3>
                {schedule.activities.length > 0 ? (
                  <ul className="space-y-0.5">
                    {schedule.activities.map((activity, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">
                    활동 내용이 없습니다.
                  </p>
                )}
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection stats={statsItems} />

      {/* Team Photo Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-gray-4">
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
      </section>
    </>
  );
}
