"use client";

import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Award } from "@/domain/entities";
import type { SerializedFirestoreData } from "@/shared/utils/serialize";

interface AwardCardProps {
  award: SerializedFirestoreData<Award>;
}

/**
 * 날짜를 포맷하는 헬퍼 함수
 */
function formatDate(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 수상 카드 컴포넌트
 * 수상 내역을 표시하는 카드 UI (이미지 없이 텍스트 중심)
 */
export function AwardCard({ award }: AwardCardProps) {
  const dateStr = formatDate(award.awardDate);

  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-amber-200/50 hover:border-amber-300/70 transition-colors">
      {/* Content */}
      <div className="p-5">
        {/* Award Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0">
            {award.awardTitle}
          </Badge>
        </div>

        {/* Project Name */}
        <h3 className="text-base font-semibold text-foreground line-clamp-2 mb-1">
          {award.projectName}
        </h3>

        {/* Competition Name */}
        <p className="text-sm text-muted-foreground line-clamp-1">
          {award.competitionName}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{award.generation}기</span>
          {dateStr && (
            <>
              <span>·</span>
              <span>{dateStr}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
