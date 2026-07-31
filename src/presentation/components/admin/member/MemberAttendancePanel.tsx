"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { meetingAdminRepository } from "@/infrastructure/repositories/admin/meetingAdminRepository";
import {
  attendanceAdminRepository,
  type MemberAttendanceInput,
} from "@/infrastructure/repositories/admin/attendanceAdminRepository";
import {
  ATTENDANCE_STATUS_LABELS,
  type AttendanceStatus,
  type Meeting,
  type Member,
} from "@/domain/entities";

interface MemberAttendancePanelProps {
  member: Member;
}

/** 출결 상태 선택 순서 */
const STATUS_OPTIONS: AttendanceStatus[] = ["present", "late", "excused", "absent"];

/** 출결 상태별 버튼 스타일 */
const STATUS_BUTTON_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-primary text-primary-foreground border-primary",
  late: "bg-amber-100 text-amber-900 border-amber-300",
  excused: "bg-muted text-muted-foreground border-border",
  absent: "bg-destructive/10 text-destructive border-destructive/30",
};

/**
 * 날짜를 YYYY.MM.DD 형식으로 변환합니다.
 */
function formatDate(date: Date | null): string {
  if (!date) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * 회원 기준 출결 입력 패널
 *
 * /admin/meetings가 "회차 → 전체 회원" 방향이라면,
 * 이 패널은 "회원 → 전체 회차" 방향으로 입력합니다.
 */
export function MemberAttendancePanel({ member }: MemberAttendancePanelProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allMeetings, records] = await Promise.all([
        meetingAdminRepository.getAll(),
        attendanceAdminRepository.getByMemberId(member.id),
      ]);

      // 이전 기수에 가입한 정회원도 현재 기수 정기모임에 참석하므로,
      // 가입 기수 이상의 회차를 모두 표시합니다.
      const targetMeetings = allMeetings
        .filter((meeting) => meeting.generation >= member.generation)
        .sort((a, b) => a.generation - b.generation || a.round - b.round);

      const next: Record<string, AttendanceStatus> = {};
      for (const record of records) {
        next[record.meetingId] = record.status;
      }

      setMeetings(targetMeetings);
      setStatusMap(next);
    } catch (error) {
      console.error("Failed to fetch member attendance:", error);
      toast.error("출결 기록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [member.id, member.generation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    const inputs: MemberAttendanceInput[] = meetings.map((meeting) => ({
      meetingId: meeting.id,
      generation: meeting.generation,
      round: meeting.round,
      status: statusMap[meeting.id] ?? "absent",
    }));

    setSaving(true);
    try {
      await attendanceAdminRepository.saveManyForMember(member.id, inputs);
      toast.success("출결이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save member attendance:", error);
      toast.error("출결 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const setAllStatus = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const meeting of meetings) {
      next[meeting.id] = status;
    }
    setStatusMap(next);
  };

  const attendedCount = meetings.filter((meeting) => {
    const status = statusMap[meeting.id] ?? "absent";
    return status === "present" || status === "late";
  }).length;

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-card">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {member.generation}기에 등록된 정기모임 회차가 없습니다.
        <br />
        &apos;정기모임 출결&apos; 메뉴에서 회차를 먼저 추가해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          전체 {meetings.length}회차 중 참석 {attendedCount}회
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setAllStatus("present")}>
            전체 출석
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAllStatus("absent")}>
            전체 결석
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            출결 저장
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {meetings.map((meeting) => {
          const status = statusMap[meeting.id] ?? "absent";
          return (
            <li
              key={meeting.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {meeting.round}회차
                  </span>
                  <span className="truncate">{meeting.title}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(meeting.meetingDate?.toDate?.() ?? null)}
                  {!meeting.isActive && " · 집계 제외"}
                </p>
              </div>

              <div className="flex gap-1">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setStatusMap((prev) => ({ ...prev, [meeting.id]: option }))
                    }
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      status === option
                        ? STATUS_BUTTON_STYLES[option]
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {ATTENDANCE_STATUS_LABELS[option]}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
