"use client";

import { Trophy } from "lucide-react";
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
    <section className="py-16 md:py-20 bg-gradient-to-b from-stone-100 to-stone-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="mb-10">
          <span className="inline-block text-sm font-medium text-stone-600 bg-white rounded-full px-4 py-1.5 mb-3">
            AWARDS
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            수상 내역
          </h2>
        </div>

        {/* Empty State */}
        {isEmpty && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              아직 등록된 수상 내역이 없습니다.
            </p>
          </div>
        )}

        {/* Awards List */}
        {!isEmpty && (
          <div className="space-y-10">
            {sortedYears.map((year) => (
              <div key={year}>
                {/* 연도 헤더 */}
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-2xl font-bold text-foreground">{year}</p>
                  <div className="flex-1 h-px bg-stone-300" />
                </div>

                {/* 해당 연도의 수상 내역들 */}
                <ul className="space-y-3">
                  {awardsByYear[year].map((award) => (
                    <AwardItem key={award.id} award={award} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * 수상 아이템 컴포넌트
 */
function AwardItem({ award }: { award: SerializedFirestoreData<Award> }) {
  const { month } = formatDate(award.awardDate);

  return (
    <li className="flex items-center gap-4 bg-white rounded-full py-3 px-4">
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <Trophy className="w-4 h-4 text-amber-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{award.projectName}</p>
        <p className="text-sm text-muted-foreground">{award.competitionName}</p>
      </div>

      {/* Chips */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {month && (
          <span className="text-xs font-medium text-stone-600 bg-stone-100 rounded-full px-3 py-1">
            {month}
          </span>
        )}
        <span className="text-xs font-medium text-stone-600 bg-stone-100 rounded-full px-3 py-1">
          {award.generation}기
        </span>
        <span className="text-xs font-medium text-amber-700 bg-amber-100 rounded-full px-3 py-1">
          {award.awardTitle}
        </span>
      </div>
    </li>
  );
}
