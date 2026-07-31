import Link from "next/link";
import { ExternalLink, Sprout } from "lucide-react";
import type { LevelProgressDto, MemberProfileDto } from "@/application/dtos/memberAchievement";

interface AchievementHeroProps {
  member: MemberProfileDto;
  level: LevelProgressDto;
}

/**
 * 업적 페이지 헤더 - 회원 정보와 레벨 진행 바
 */
export function AchievementHero({ member, level }: AchievementHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-[#4BBE38] text-primary-foreground">
      {/* 배경 장식 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />

      <div className="container-custom relative py-14 md:py-20">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur">
                {member.generation}기
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur">
                {member.memberType}
              </span>
              {!member.isActive && (
                <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-medium backdrop-blur">
                  활동 종료
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {member.memberName}
            </h1>

            <p className="flex items-center gap-2 text-lg text-white/90">
              <Sprout className="h-5 w-5" aria-hidden />
              <span>
                Lv.{level.level} · {level.title}
              </span>
            </p>

            {member.externalUrl && (
              <Link
                href={member.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                개인 페이지 방문
              </Link>
            )}
          </div>

          {/* 경험치 진행 바 */}
          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-white/90">경험치</span>
              <span className="font-semibold">
                {level.totalXp.toLocaleString()} XP
              </span>
            </div>

            <div
              className="h-3 w-full overflow-hidden rounded-full bg-white/25"
              role="progressbar"
              aria-valuenow={level.progressRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`레벨 ${level.level} 진행률`}
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-700 ease-out"
                style={{ width: `${level.progressRate}%` }}
              />
            </div>

            <p className="text-right text-xs text-white/80">
              {level.xpToNextLevel > 0
                ? `다음 레벨까지 ${level.xpToNextLevel.toLocaleString()} XP`
                : "최고 레벨 구간에 도달했습니다"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
