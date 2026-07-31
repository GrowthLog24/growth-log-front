import {
  Award,
  BookOpen,
  Crown,
  Flame,
  Footprints,
  Hammer,
  Library,
  Lock,
  PenLine,
  Rocket,
  Sparkles,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BADGE_TIER_LABELS, type BadgeTier } from "@/domain/achievements";
import type { BadgeDto } from "@/application/dtos/memberAchievement";
import { SectionHeading } from "./SectionHeading";

interface BadgeGridProps {
  badges: readonly BadgeDto[];
}

/**
 * 도메인의 아이콘 식별자를 실제 아이콘 컴포넌트로 매핑
 *
 * 도메인 레이어가 lucide-react에 의존하지 않도록,
 * 문자열 → 컴포넌트 변환은 presentation 레이어에서만 수행합니다.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  Flame,
  Zap,
  Trophy,
  Crown,
  PenLine,
  BookOpen,
  Library,
  Rocket,
  Hammer,
  Sparkles,
};

/**
 * 획득 배지의 등급별 색상
 */
const TIER_STYLES: Record<BadgeTier, string> = {
  bronze: "border-amber-500/45 text-amber-800",
  silver: "border-slate-500/35 text-slate-700",
  gold: "border-yellow-600/45 text-yellow-800",
  platinum: "border-primary/45 text-primary",
};

/**
 * 배지 목록 섹션
 */
export function BadgeGrid({ badges }: BadgeGridProps) {
  const earnedCount = badges.filter((badge) => badge.earned).length;

  return (
    <section className="relative bg-gray-6 py-10 md:py-16">
      <div className="container-custom">
        <SectionHeading
          eyebrow="BADGES"
          title="업적 배지"
          description={`전체 ${badges.length}개 중 ${earnedCount}개를 획득했습니다.`}
        />

        <ul className="relative grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4" data-member-reveal>
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function BadgeCard({ badge }: { badge: BadgeDto }) {
  const Icon = ICON_MAP[badge.icon] ?? Award;

  return (
    <li
      className={`relative border-t pt-5 transition-transform duration-300 hover:-translate-y-1 ${
        badge.earned
          ? TIER_STYLES[badge.tier]
          : "border-black/15 opacity-45"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/65"
        >
          {badge.earned ? (
            <Icon className="h-6 w-6" aria-hidden />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
        </span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            badge.earned ? "" : "text-muted-foreground"
          }`}
        >
          {BADGE_TIER_LABELS[badge.tier]}
        </span>
      </div>

      <p
        className={`font-semibold ${badge.earned ? "text-foreground" : "text-muted-foreground"}`}
      >
        {badge.name}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {badge.description}
      </p>

      {/* 미획득 배지는 달성 진행률을 노출해 다음 목표를 알려줍니다. */}
      {!badge.earned && (
        <div className="mt-3">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={badge.progressRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${badge.name} 진행률`}
          >
            <div
              className="h-full rounded-full bg-primary/60"
              style={{ width: `${badge.progressRate}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            {badge.progressRate}%
          </p>
        </div>
      )}
    </li>
  );
}
