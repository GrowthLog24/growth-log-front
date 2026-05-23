"use client";

import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Award } from "@/domain/entities";
import type { SerializedFirestoreData } from "@/shared/utils/serialize";

interface AwardsSectionProps {
  awards: SerializedFirestoreData<Award>[];
}

/**
 * 날짜를 포맷하는 헬퍼 함수
 */
function formatDate(timestamp: number): { year: string; month: string } {
  if (!timestamp) return { year: "", month: "" };
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return { year: "", month: "" };
  return {
    year: String(date.getFullYear()),
    month: `${date.getMonth() + 1}월`,
  };
}

/**
 * 수상 내역 섹션 컴포넌트
 * 연혁(타임라인) 스타일로 표시
 */
export function AwardsSection({ awards }: AwardsSectionProps) {
  const isEmpty = awards.length === 0;

  // 연도별로 그룹핑
  const awardsByYear = awards.reduce<Record<string, SerializedFirestoreData<Award>[]>>(
    (acc, award) => {
      const { year } = formatDate(award.awardDate);
      const key = year || "기타";
      if (!acc[key]) acc[key] = [];
      acc[key].push(award);
      return acc;
    },
    {}
  );

  // 연도 내림차순 정렬 (최신순)
  const sortedYears = Object.keys(awardsByYear).sort((a, b) => {
    if (a === "기타") return 1;
    if (b === "기타") return -1;
    return Number(b) - Number(a);
  });

  return (
    <section className="py-16 bg-gradient-to-b from-amber-50/50 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="mb-10">
          <span className="inline-block px-4 py-1.5 bg-amber-500/10 rounded-full text-sm font-medium text-amber-600 mb-3">
            AWARDS
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            수상 내역
          </h2>
          <p className="mt-2 text-muted-foreground">
            그로스로그 프로젝트의 빛나는 성과들
          </p>
        </div>

        {/* Empty State */}
        {isEmpty && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              아직 등록된 수상 내역이 없습니다.
            </p>
          </div>
        )}

        {/* Timeline */}
        {!isEmpty && (
          <div className="space-y-8">
            {sortedYears.map((year) => (
              <div key={year}>
                {/* 연도 헤더 */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl md:text-4xl font-bold text-amber-500">
                    {year}
                  </span>
                  <div className="flex-1 h-px bg-amber-200" />
                </div>

                {/* 해당 연도의 수상 내역들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-amber-200 ml-4">
                  {awardsByYear[year].map((award, index) => (
                    <AwardTimelineItem
                      key={award.id}
                      award={award}
                      showDot={index % 2 === 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * 타임라인 아이템 컴포넌트
 */
function AwardTimelineItem({
  award,
  showDot,
}: {
  award: SerializedFirestoreData<Award>;
  showDot: boolean;
}) {
  const { month } = formatDate(award.awardDate);

  return (
    <div className="relative">
      {/* 연결 점 - 왼쪽 열만 표시 */}
      {showDot && (
        <div className="absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
      )}

      {/* 카드 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all">
        <div className="flex items-start gap-3">
          {/* 트로피 아이콘 */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0">
                {award.awardTitle}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {award.generation}기
              </Badge>
              {month && (
                <span className="text-xs text-muted-foreground">{month}</span>
              )}
            </div>
            <h3 className="font-semibold text-foreground">
              {award.projectName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {award.competitionName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
