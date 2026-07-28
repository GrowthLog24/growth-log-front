import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
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
import { InteractiveValues, StatsSection } from "@/presentation/components/about";

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
      <section className="relative min-h-[720px] overflow-hidden bg-gray-black text-white md:min-h-[820px]">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src="/videos/our-shift-loop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gray-black/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-black/85 via-gray-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-black/80 via-transparent to-gray-black/20" />

        <div className="container-custom relative z-10 flex min-h-[720px] flex-col justify-between py-14 md:min-h-[820px] md:py-20 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-green-8">
              <span className="h-2 w-2 rounded-full bg-green-6" />
              OUR SHIFT
            </span>
            <h2 className="mt-7 max-w-5xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
              교내 커뮤니티에서
              <br />
              AI-Native 커뮤니티로
            </h2>
            <p className="mt-8 max-w-2xl text-sm leading-7 text-white/75 md:text-lg md:leading-8">
              Growth Log는 KNOU 컴퓨터과학과에서 시작했습니다. 그 뿌리는 그대로 KNOU CS
              트랙으로 이어가되, 이제는 전공과 소속을 넘어{" "}
              <strong className="font-semibold text-white">
                &lsquo;AI와 함께 성장하려는 모든 개발자&rsquo;
              </strong>
              에게 문을 엽니다.
            </p>
          </div>

          <div className="grid gap-6 border-t border-white/25 pt-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center md:gap-10">
            <div>
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/50">
                AS-IS
              </span>
              <h3 className="mt-2 text-base font-bold md:text-lg">{SHIFT.asIs.title}</h3>
              <p className="mt-1 text-sm text-white/60">{SHIFT.asIs.description}</p>
            </div>
            <ArrowRight className="hidden h-5 w-5 text-green-6 sm:block" aria-hidden="true" />
            <div>
              <span className="text-[10px] font-bold tracking-[0.18em] text-green-7">
                TO-BE
              </span>
              <h3 className="mt-2 text-base font-bold md:text-lg">{SHIFT.toBe.title}</h3>
              <p className="mt-1 text-sm text-white/60">{SHIFT.toBe.description}</p>
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

          <InteractiveValues />
        </div>
      </section>

      {/* How we grow */}
      <section className="bg-gray-6 px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="container-custom">
          <div className="mb-8 max-w-3xl md:mb-14">
            <span className="text-xs font-bold tracking-[0.18em] text-primary">
              HOW WE GROW
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Growth Log에서 이렇게 성장합니다
            </h2>
          </div>

          <div>
            {GROWTH_TRACKS.map((track, index) => (
              <article
                key={track.title}
                className="grid items-center gap-10 border-t border-gray-4 py-16 first:border-t-0 md:grid-cols-2 md:gap-16 md:py-24 lg:gap-24"
              >
                <div
                  className={[
                    "group relative min-h-[360px] md:min-h-[500px]",
                    index % 2 === 0 ? "md:order-1" : "md:order-2",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "absolute inset-x-0 top-0 h-[88%] overflow-hidden rounded-[2rem]",
                      index === 0
                        ? "bg-gray-black"
                        : index === 1
                          ? "bg-green-9"
                          : index === 2
                            ? "bg-primary"
                            : "bg-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute -right-3 -top-10 text-[10rem] font-black leading-none tracking-tighter md:text-[14rem]",
                        index === 0
                          ? "text-white/5"
                          : index === 2
                            ? "text-white/10"
                            : "text-gray-black/5",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      0{index + 1}
                    </span>
                    <div
                      className={[
                        "absolute inset-0 opacity-40",
                        index === 0 || index === 2
                          ? "bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.25),transparent_35%)]"
                          : "bg-[radial-gradient(circle_at_70%_30%,rgba(0,150,43,0.22),transparent_35%)]",
                      ].join(" ")}
                    />
                    <span
                      className={[
                        "absolute left-7 top-7 text-xs font-semibold tracking-[0.16em]",
                        index === 0 || index === 2 ? "text-white/65" : "text-foreground/55",
                      ].join(" ")}
                    >
                      GROWTH TRACK / 0{index + 1}
                    </span>
                  </div>

                  <div
                    className={[
                      "absolute bottom-0 flex h-48 w-48 items-center justify-center rounded-full border-[14px] shadow-[0_24px_70px_rgba(34,34,34,0.18)] transition-transform duration-500 group-hover:-translate-y-3 group-hover:rotate-3 motion-reduce:transition-none md:h-64 md:w-64",
                      index % 2 === 0 ? "right-5 md:right-8" : "left-5 md:left-8",
                      index === 0
                        ? "border-green-7 bg-primary text-white"
                        : index === 1
                          ? "border-white bg-gray-black text-white"
                          : index === 2
                            ? "border-green-9 bg-white text-primary"
                            : "border-green-8 bg-green-2 text-white",
                    ].join(" ")}
                  >
                    <track.icon className="h-16 w-16 md:h-24 md:w-24" strokeWidth={1.25} />
                  </div>
                </div>

                <div className={index % 2 === 0 ? "md:order-2" : "md:order-1"}>
                  <span className="text-xs font-bold tracking-[0.18em] text-primary">
                    0{index + 1}
                  </span>
                  <h3 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                    {track.title}
                  </h3>
                  <p className="mt-6 max-w-md text-base leading-8 text-muted-foreground">
                    {track.description}
                  </p>
                  <Link
                    href={track.href}
                    className="group/link mt-10 inline-flex items-center gap-3 border-b border-foreground pb-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    트랙 살펴보기
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </article>
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
