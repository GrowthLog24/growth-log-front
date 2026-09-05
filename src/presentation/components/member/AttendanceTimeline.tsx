import { ATTENDANCE_STATUS_LABELS, type AttendanceStatus } from "@/domain/entities";
import type { AttendanceSummaryDto } from "@/application/dtos/memberAchievement";
import { SectionHeading } from "./SectionHeading";

interface AttendanceTimelineProps {
  attendance: AttendanceSummaryDto;
}

/**
 * 출결 상태별 배지 스타일
 */
const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "border-primary bg-primary text-primary-foreground",
  late: "border-amber-400 bg-amber-100 text-amber-900",
  excused: "border-border bg-muted text-muted-foreground",
  absent: "border-border bg-background text-muted-foreground",
};

/**
 * 회차별 출결 기록 섹션
 */
export function AttendanceTimeline({ attendance }: AttendanceTimelineProps) {
  if (attendance.totalMeetings === 0) {
    return (
      <section className="container-custom py-10 md:py-14">
        <SectionHeading
          eyebrow="ATTENDANCE"
          title="정기모임 출결"
          description="아직 집계된 정기모임 회차가 없습니다."
        />
      </section>
    );
  }

  return (
    <section className="container-custom py-10 md:py-14">
      <SectionHeading
        eyebrow="ATTENDANCE"
        title="정기모임 출결"
        description={`총 ${attendance.totalMeetings}회 중 ${attendance.attendedCount}회 참석했습니다.`}
      />

      {/* 회차 그리드 */}
      <ul className="border-t border-black/10" data-member-reveal>
        {attendance.timeline.map((item) => (
          <li
            key={`${item.generation}-${item.round}`}
            className="group border-b border-black/10"
          >
            <div
              className="grid grid-cols-[46px_1fr_auto] items-center gap-3 py-3.5 sm:grid-cols-[64px_1fr_100px] sm:py-4"
              title={`${item.meetingTitle} · ${ATTENDANCE_STATUS_LABELS[item.status]}`}
            >
              <span className="font-mono text-xs text-muted-foreground">{String(item.round).padStart(2, "0")}</span>
              <span className="truncate text-sm font-medium transition-transform duration-300 group-hover:translate-x-1">{item.meetingTitle}</span>
              <span className={`justify-self-end rounded-full border px-2.5 py-1 text-[10px] font-medium ${STATUS_STYLES[item.status]}`}>
                {ATTENDANCE_STATUS_LABELS[item.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* 범례 */}
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
        {(Object.keys(STATUS_STYLES) as AttendanceStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full border ${STATUS_STYLES[status]}`}
              aria-hidden
            />
            {ATTENDANCE_STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </section>
  );
}
