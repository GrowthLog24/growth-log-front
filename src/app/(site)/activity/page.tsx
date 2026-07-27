import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ActivityCategorySection } from "@/presentation/components/activity";
import { getTrackSections } from "../_shared/activityTracks";

export const metadata: Metadata = {
  title: "Activity",
  description:
    "기록하고, 모이고, 성장합니다. 그로스로그의 성장일지와 클럽 활동을 확인하세요.",
};

/** 매 요청마다 최신 데이터 조회 (인덱스 안정화 후 revalidate = 3600으로 전환) */
export const dynamic = "force-dynamic";

/**
 * 5기 리뉴얼로 다른 트랙으로 옮겨간 활동 안내
 * 기존 방문자가 "없어졌다"고 오해하지 않도록 이동처를 남깁니다.
 */
const MOVED_TRACKS = [
  {
    href: "/dev-ai",
    label: "Dev×AI",
    movedLabel: "AI·개발 특강/세미나",
    description: "AI·개발 전문가 특강 · 개발/커리어 세미나",
  },
  {
    href: "/knou-cs",
    label: "KNOU CS",
    movedLabel: "학사·전공 스터디",
    description: "학사·전공 스터디 · 기출 CBT · 학사 세미나",
  },
] as const;

export default async function ActivityPage() {
  const sections = await getTrackSections("activity");

  return (
    <>
      <section className="section-padding bg-white">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            ACTIVITY
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            기록하고, 모이고, 성장합니다
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            스터디·특강·세미나는 각 전문 트랙으로 이동했습니다. Activity에는 커뮤니티의 심장인
            성장일지와 클럽 활동이 남습니다.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {MOVED_TRACKS.map((track) => (
              <span
                key={track.href}
                className="rounded-md border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {track.movedLabel} → {track.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {sections.map((section, index) => (
        <ActivityCategorySection
          key={section.category}
          category={section.category}
          activities={section.activities}
          isOdd={index % 2 === 0}
        />
      ))}

      {/* 이동 안내 - 기존 카테고리를 찾는 방문자를 위한 길잡이 */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            스터디·특강을 찾으시나요?
          </h2>
          <p className="mt-3 text-muted-foreground">
            활동이 더 전문화됐습니다. 트랙별로 살펴보세요.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOVED_TRACKS.map((track) => (
              <Link
                key={track.href}
                href={track.href}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-gray-6 p-6 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span>
                  <span className="block text-lg font-semibold text-foreground">
                    {track.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {track.description}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
