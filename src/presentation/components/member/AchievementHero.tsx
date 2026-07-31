import { Sprout } from "lucide-react";
import type { LevelProgressDto, MemberProfileDto } from "@/application/dtos/memberAchievement";
import { getGrowthStage, GrowthTree } from "./GrowthTree";

interface AchievementHeroProps {
  member: MemberProfileDto;
  level: LevelProgressDto;
}

/**
 * 업적 페이지 헤더 - 회원 정보와 레벨 진행 바
 */
export function AchievementHero({ member, level }: AchievementHeroProps) {
  const growthStage = getGrowthStage(level.level);

  return (
    <section className="member-hero-surface relative overflow-hidden border-b border-primary/15 text-foreground">
      <div className="container-custom relative py-5 md:py-7">
        <div className="grid items-center gap-5 md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_300px] lg:gap-8">
          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{member.generation}기</span>
              <span className="rounded-full bg-gray-6 px-3 py-1 text-muted-foreground">{member.memberType}</span>
              {member.field && <span className="rounded-full bg-gray-6 px-3 py-1 text-muted-foreground">{member.field}</span>}
            </div>
            <h1 className="member-hero-title text-4xl font-bold leading-tight tracking-[-0.04em] md:text-6xl">
              {member.memberName}
            </h1>
            {member.bio && <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{member.bio}</p>}

            <div className="mt-5 max-w-xl">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="flex items-center gap-2 text-base font-semibold md:text-lg">
                  <Sprout className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  Lv.{level.level} · {growthStage.label}
                </p>
                <span className="text-xs text-muted-foreground">{level.totalXp.toLocaleString()} XP</span>
              </div>
              <div
                className="mt-2.5 h-2 overflow-hidden rounded-full bg-primary/10"
                role="progressbar"
                aria-valuenow={level.progressRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`레벨 ${level.level} 진행률`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-1000"
                  style={{ width: `${level.progressRate}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {level.xpToNextLevel > 0
                  ? `다음 레벨까지 ${level.xpToNextLevel.toLocaleString()} XP`
                  : "최고 레벨 달성"}
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[280px] md:mx-0 md:max-w-[320px]">
            <GrowthTree level={level} />
            {!member.isActive && <span className="absolute right-1 top-4 rounded-full bg-gray-6 px-2.5 py-1 text-[10px] text-muted-foreground">활동 종료</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
