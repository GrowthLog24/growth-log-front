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
      <section className="container-custom py-12">
        <SectionHeading
          eyebrow="ATTENDANCE"
          title="정기모임 출결"
          description="아직 집계된 정기모임 회차가 없습니다."
        />
      </section>
    );
  }

  return (
    <section className="container-custom py-12">
      <SectionHeading
        eyebrow="ATTENDANCE"
        title="정기모임 출결"
        description={`총 ${attendance.totalMeetings}회 중 ${attendance.attendedCount}회 참석했습니다.`}
      />

      {/* 회차 그리드 */}
      <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {attendance.timeline.map((item) => (
          <li key={item.round}>
            <div
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 transition-transform hover:scale-105 ${STATUS_STYLES[item.status]}`}
              title={`${item.meetingTitle} · ${ATTENDANCE_STATUS_LABELS[item.status]}`}
            >
              <span className="text-lg font-bold">{item.round}</span>
              <span className="text-[10px] font-medium">
                {ATTENDANCE_STATUS_LABELS[item.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* 범례 */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.keys(STATUS_STYLES) as AttendanceStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-3 w-3 rounded border-2 ${STATUS_STYLES[status]}`}
              aria-hidden
            />
            {ATTENDANCE_STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </section>
  );
}
