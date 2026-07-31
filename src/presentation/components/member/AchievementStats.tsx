import { CalendarCheck, Flame, PenLine, Rocket } from "lucide-react";
import type { AttendanceSummaryDto } from "@/application/dtos/memberAchievement";

interface AchievementStatsProps {
  attendance: AttendanceSummaryDto;
  growthLogCount: number;
  projectCount: number;
}

interface StatCard {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  caption: string;
}

/**
 * 핵심 지표 요약 카드
 */
export function AchievementStats({
  attendance,
  growthLogCount,
  projectCount,
}: AchievementStatsProps) {
  const cards: StatCard[] = [
    {
      icon: CalendarCheck,
      label: "출석률",
      value: `${attendance.attendanceRate}%`,
      caption: `${attendance.totalMeetings}회 중 ${attendance.attendedCount}회 참석`,
    },
    {
      icon: Flame,
      label: "연속 참석",
      value: `${attendance.currentStreak}회`,
      caption: `최장 ${attendance.longestStreak}회 연속`,
    },
    {
      icon: PenLine,
      label: "성장일지",
      value: `${growthLogCount}편`,
      caption: "제출한 기록",
    },
    {
      icon: Rocket,
      label: "프로젝트",
      value: `${projectCount}건`,
      caption: "참여한 프로젝트",
    },
  ];

  return (
    <section className="container-custom -mt-8 md:-mt-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2 text-primary">
              <card.icon className="h-5 w-5" aria-hidden />
              <span className="text-sm font-medium text-muted-foreground">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground md:text-3xl">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
