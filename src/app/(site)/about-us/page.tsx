import type { Metadata } from "next";
import Image from "next/image";
import { Flame, FileText, Laptop } from "lucide-react";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";
import { monthlyScheduleRepository } from "@/infrastructure/repositories/monthlyScheduleRepository";
import { statsRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { StatsSection } from "@/presentation/components/about";

export const metadata: Metadata = {
  title: "About Us",
  description: "그로스로그를 소개합니다. 함께 성장하는 IT 커뮤니티입니다.",
};

// 소개 아이템
const introItems = [
  {
    icon: FileText,
    title: "그로스로그는 KNOU CS의 유일한 개발자 모임입니다.",
    description:
      "KNOU에서 CS를 공부하는 현직 개발자이거나 예비 개발자라면 누구나 함께할 수 있습니다.",
  },
  {
    icon: Flame,
    title: "그로스로그에는 열정적인자기계발러들이 모여있습니다.",
    description:
      "개발에 관해 어떤 질문이라도 편하게 물어보고 알려줄 사람들과 함께 전공 지식과 실무감각을 동시에 키워보세요.",
  },
  {
    icon: Laptop,
    title: "그로스로그에서 함께 성장하세요.",
    description:
      "각자의 성장을 진심으로 응원하는 커뮤니티 멤버들과 서로 자극을 주고 받으며 개발자로서 한 해 한 해 성장하세요.",
  },
];

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
  7: "월별 정기 프로그램",
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
  const statsItems = [
    { label: "운영 기간", value: stats?.operatingYears || 0, suffix: "년" },
    { label: "현재 활동 회원", value: stats?.activeMembers || 0, suffix: "명" },
    { label: "프로젝트", value: stats?.projectsCount || 0, suffix: "개" },
    { label: "누적 기수", value: stats?.generationsCount || 0, suffix: "기" },
    { label: "누적 멤버", value: stats?.totalMembers || 0, suffix: "명" },
    { label: "성장일지 발행", value: stats?.growthPostsCount || 0, suffix: "+" },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              INTRODUCING OUR COMMUNITY
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              우리를 소개합니다
            </h1>
          </div>

          {/* Intro Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {introItems.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
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
                <h3 className="font-semibold text-foreground mb-3">
                  {PHASE_LABELS[schedule.phase]}
                </h3>
                {schedule.activities.length > 0 ? (
                  <ul className="space-y-1.5">
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
              <p className="text-sm opacity-80">그로스로그 {currentGeneration - 1}기</p>
              <h3 className="text-2xl font-bold">함께 성장하는 우리</h3>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
