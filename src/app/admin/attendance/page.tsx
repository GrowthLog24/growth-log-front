"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, Clock, AlarmClock } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { meetingAdminRepository } from "@/infrastructure/repositories/admin/meetingAdminRepository";
import { attendanceAdminRepository } from "@/infrastructure/repositories/admin/attendanceAdminRepository";
import { memberAdminRepository } from "@/infrastructure/repositories/admin/memberAdminRepository";
import {
  MEETING_TYPES,
  type MeetingType,
  type Meeting,
  type Member,
  type Attendance,
} from "@/domain/entities";
import { normalizeMeetingType } from "@/domain/meetings/meeting";
import { isLate, summarizeCheckinStats } from "@/domain/attendance/stats";

/** 체크인 시각을 한국 시간(KST) "오후 2:14:15"로 표시합니다. */
function formatKst(date: Date | null): string {
  if (!date) return "-";
  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** 회차 일자 + "HH:MM"(현지=KST)로 지각 기준 시각(epoch ms)을 만듭니다. */
function buildThresholdMs(
  meetingDate: Date | null,
  hhmm: string
): number | null {
  if (!meetingDate || !hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const threshold = new Date(meetingDate);
  threshold.setHours(h, m, 0, 0);
  return threshold.getTime();
}

/** 시(0~23) 선택지 */
const HOURS = Array.from({ length: 24 }, (_, i) => i);
/** 분(0,5,…,55) 선택지 — 5분 단위 */
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/** 숫자를 2자리 문자열로 (예: 5 → "05") */
const pad2 = (n: number) => String(n).padStart(2, "0");

interface Row {
  memberId: string;
  memberName: string;
  generation: number;
  checkedInAt: Date | null;
  status: Attendance["status"];
}

/**
 * 출석 통계 페이지.
 *
 * 회차 종류(정기모임/그로스톡)와 회차를 고르면, 출석 명단과 체크인 시각을
 * 보여주고, 지각 기준 시각을 설정해 총원·지각 인원을 집계합니다.
 */
export default function AttendanceStatsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<MeetingType>("정기모임");
  const [meetingId, setMeetingId] = useState("");
  const [records, setRecords] = useState<Attendance[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [lateHour, setLateHour] = useState("");
  const [lateMinute, setLateMinute] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [meetingList, memberList] = await Promise.all([
          meetingAdminRepository.getAll(),
          memberAdminRepository.getAll(),
        ]);
        setMeetings(meetingList);
        setMembers(memberList);
      } catch (error) {
        console.error("Failed to fetch attendance stats context:", error);
        toast.error("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const memberById = useMemo(() => {
    const map = new Map<string, Member>();
    for (const member of members) map.set(member.id, member);
    return map;
  }, [members]);

  const meetingsOfType = useMemo(
    () =>
      meetings
        .filter((meeting) => normalizeMeetingType(meeting.type) === type)
        .sort((a, b) => b.generation - a.generation || b.round - a.round),
    [meetings, type]
  );

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === meetingId) ?? null,
    [meetings, meetingId]
  );

  // 종류를 바꾸면 회차 선택 초기화
  useEffect(() => {
    setMeetingId("");
    setRecords([]);
  }, [type]);

  // 회차를 고르면 출결 기록 로드
  useEffect(() => {
    if (!meetingId) return;
    let active = true;
    setRecordsLoading(true);
    (async () => {
      try {
        const list = await attendanceAdminRepository.getByMeetingId(meetingId);
        if (active) setRecords(list);
      } catch (error) {
        console.error("Failed to fetch attendances:", error);
        toast.error("출결 기록을 불러오는데 실패했습니다.");
      } finally {
        if (active) setRecordsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [meetingId]);

  // 출석(출석/지각) 명단 — 체크인 시각 오름차순
  const rows = useMemo<Row[]>(() => {
    return records
      .filter((r) => r.status === "present" || r.status === "late")
      .map((r) => ({
        memberId: r.memberId,
        memberName: memberById.get(r.memberId)?.memberName ?? "(이름 없음)",
        generation: memberById.get(r.memberId)?.generation ?? r.generation,
        checkedInAt: r.createdAt?.toDate?.() ?? null,
        status: r.status,
      }))
      .sort((a, b) => {
        const at = a.checkedInAt?.getTime() ?? Infinity;
        const bt = b.checkedInAt?.getTime() ?? Infinity;
        return at - bt;
      });
  }, [records, memberById]);

  // 시·분이 모두 선택됐을 때만 "HH:MM" 기준 시각을 만듭니다.
  const lateTime =
    lateHour !== "" && lateMinute !== ""
      ? `${pad2(Number(lateHour))}:${pad2(Number(lateMinute))}`
      : "";

  const thresholdMs = buildThresholdMs(
    selectedMeeting?.meetingDate?.toDate?.() ?? null,
    lateTime
  );

  const stats = summarizeCheckinStats(
    rows.map((r) => r.checkedInAt?.getTime() ?? null),
    thresholdMs
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">출석 통계</h1>
        <p className="text-sm text-muted-foreground">
          회차별 출석 명단과 체크인 시각을 확인하고, 지각 기준을 설정해
          집계합니다.
        </p>
      </header>

      {/* 필터 */}
      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>회차 종류</Label>
          <Select value={type} onValueChange={(v) => setType(v as MeetingType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEETING_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>회차</Label>
          <Select
            value={meetingId}
            onValueChange={setMeetingId}
            disabled={loading || meetingsOfType.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={loading ? "불러오는 중…" : "회차 선택"}
              />
            </SelectTrigger>
            <SelectContent>
              {meetingsOfType.map((meeting) => (
                <SelectItem key={meeting.id} value={meeting.id}>
                  {meeting.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>지각 기준 시각 (KST)</Label>
          <div className="flex gap-2">
            <Select value={lateHour} onValueChange={setLateHour}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="시" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {pad2(h)}시
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={lateMinute} onValueChange={setLateMinute}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="분" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {pad2(m)}분
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 요약 */}
      {meetingId && (
        <section className="grid grid-cols-3 gap-3">
          <SummaryCard
            icon={<Users className="h-5 w-5" />}
            label="총 출석"
            value={`${stats.total}명`}
          />
          <SummaryCard
            icon={<AlarmClock className="h-5 w-5" />}
            label={lateTime ? `지각 (${lateTime} 이후)` : "지각"}
            value={`${stats.lateCount}명`}
            accent
          />
          <SummaryCard
            icon={<Clock className="h-5 w-5" />}
            label="정시"
            value={`${stats.onTimeCount}명`}
          />
        </section>
      )}

      {/* 명단 */}
      <section className="rounded-lg border border-border bg-card">
        {!meetingId ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            회차를 선택하면 출석 명단이 표시됩니다.
          </p>
        ) : recordsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            아직 출석 기록이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">이름</th>
                  <th className="px-4 py-2.5 font-medium">기수</th>
                  <th className="px-4 py-2.5 font-medium">체크인 시각</th>
                  <th className="px-4 py-2.5 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const late = isLate(
                    row.checkedInAt?.getTime() ?? null,
                    thresholdMs
                  );
                  return (
                    <tr
                      key={row.memberId}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {row.memberName}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {row.generation}기
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                        {formatKst(row.checkedInAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        {late ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                            지각
                          </span>
                        ) : (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                            정시
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * 요약 카드
 */
function SummaryCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        accent ? "border-amber-300/60 bg-amber-50/60" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
