import type { AttendanceSummaryDto } from "@/application/dtos/memberAchievement";

interface AchievementStatsProps {
  attendance: AttendanceSummaryDto;
  growthLogCount: number;
  projectCount: number;
}

interface StatCard {
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
      label: "출석률",
      value: `${attendance.attendanceRate}%`,
      caption: `${attendance.totalMeetings}회 중 ${attendance.attendedCount}회 참석`,
    },
    {
      label: "연속 참석",
      value: `${attendance.currentStreak}회`,
      caption: `최장 ${attendance.longestStreak}회 연속`,
    },
    {
      label: "성장일지",
      value: `${growthLogCount}편`,
      caption: "제출한 기록",
    },
    {
      label: "프로젝트",
      value: `${projectCount}건`,
      caption: "참여한 프로젝트",
    },
  ];

  return (
    <section className="container-custom py-8 md:py-10" data-member-reveal>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="px-2 py-2 text-center lg:px-6"
          >
            <span className="font-mono text-[10px] tracking-[.18em] text-muted-foreground">{card.label}</span>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-foreground md:text-4xl">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{card.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
