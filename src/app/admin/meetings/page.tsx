"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Pencil, Save, Users, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/presentation/components/admin";
import { meetingAdminRepository } from "@/infrastructure/repositories/admin/meetingAdminRepository";
import {
  attendanceAdminRepository,
  type AttendanceInput,
} from "@/infrastructure/repositories/admin/attendanceAdminRepository";
import { memberAdminRepository } from "@/infrastructure/repositories/admin/memberAdminRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { checkinConfigRepository } from "@/infrastructure/repositories/checkinConfigRepository";
import { checkinConfigAdminRepository } from "@/infrastructure/repositories/admin/checkinConfigAdminRepository";
import {
  ATTENDANCE_STATUS_LABELS,
  MEETING_TYPES,
  type AttendanceStatus,
  type Meeting,
  type MeetingType,
  type Member,
} from "@/domain/entities";
import {
  buildMeetingTitle,
  normalizeMeetingType,
} from "@/domain/meetings/meeting";

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
 * 정기모임 출결 관리 페이지
 */
export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentGeneration, setCurrentGeneration] = useState(0);

  // 현재 QR 체크인이 열려 있는 회차 ID (없으면 null)
  const [checkinMeetingId, setCheckinMeetingId] = useState<string | null>(null);
  const [checkinToggling, setCheckinToggling] = useState(false);

  // 회차 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    generation: string;
    round: string;
    type: MeetingType;
    meetingDate: Date | undefined;
  }>({
    generation: "",
    round: "",
    type: "정기모임",
    meetingDate: undefined,
  });

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 출결 체크 상태
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingList, memberList, siteConfig, checkinConfig] =
        await Promise.all([
          meetingAdminRepository.getAll(),
          memberAdminRepository.getAll(),
          siteConfigRepository.getSiteConfig(),
          checkinConfigRepository.getCurrent(),
        ]);
      setMeetings(meetingList);
      setMembers(memberList);
      setCurrentGeneration(siteConfig?.currentGeneration ?? 0);
      setCheckinMeetingId(
        checkinConfig?.open ? checkinConfig.meetingId : null
      );
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      toast.error("목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * 회차의 QR 체크인을 열거나 닫습니다.
   * 한 번에 한 회차만 열 수 있습니다(다른 회차를 열면 이전 회차는 닫힘).
   */
  const toggleCheckin = async (meeting: Meeting) => {
    const willOpen = checkinMeetingId !== meeting.id;
    setCheckinToggling(true);
    try {
      await checkinConfigAdminRepository.setCurrent(
        willOpen ? meeting.id : null,
        willOpen
      );
      setCheckinMeetingId(willOpen ? meeting.id : null);
      toast.success(
        willOpen
          ? `체크인을 열었어요 — ${meeting.title}`
          : "체크인을 닫았어요."
      );
    } catch (error) {
      console.error("Failed to toggle checkin:", error);
      toast.error("체크인 설정에 실패했습니다.");
    } finally {
      setCheckinToggling(false);
    }
  };

  /**
   * 회차 시점에 활동 중이던 활성 회원을 출결 대상으로 표시합니다.
   *
   * 이전 기수에 가입한 정회원도 현재 기수 정기모임에 참석하므로,
   * 가입 기수가 회차 기수 이하인 회원을 모두 포함합니다.
   */
  const targetMembers = useMemo(() => {
    if (!selectedMeeting) return [];
    return members
      .filter(
        (member) =>
          member.generation <= selectedMeeting.generation && member.isActive
      )
      .sort((a, b) => a.memberName.localeCompare(b.memberName, "ko"));
  }, [members, selectedMeeting]);

  const openCreateDialog = () => {
    setEditingMeeting(null);
    setForm({
      generation: String(currentGeneration || ""),
      round: "",
      type: "정기모임",
      meetingDate: undefined,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setForm({
      generation: String(meeting.generation),
      round: String(meeting.round),
      type: normalizeMeetingType(meeting.type),
      meetingDate: meeting.meetingDate?.toDate?.(),
    });
    setDialogOpen(true);
  };

  const handleSaveMeeting = async () => {
    const generation = Number(form.generation);
    const round = Number(form.round);

    if (!Number.isInteger(generation) || generation <= 0) {
      toast.error("기수를 올바르게 입력해주세요.");
      return;
    }
    if (!Number.isInteger(round) || round <= 0) {
      toast.error("회차를 올바르게 입력해주세요.");
      return;
    }
    if (!form.meetingDate) {
      toast.error("모임 일자를 선택해주세요.");
      return;
    }

    // 회차 번호는 같은 종류(정기모임/그로스톡) 안에서만 고유하면 됩니다.
    // 정기모임 1회차와 그로스톡 1회차는 서로 무관한 별개 회차입니다.
    const duplicated = meetings.some(
      (meeting) =>
        meeting.id !== editingMeeting?.id &&
        meeting.generation === generation &&
        meeting.round === round &&
        normalizeMeetingType(meeting.type) === form.type
    );
    if (duplicated) {
      toast.error(
        `${generation}기 ${round}회차 ${form.type}가 이미 등록되어 있습니다.`
      );
      return;
    }

    const title = buildMeetingTitle(generation, round, form.type);

    setSaving(true);
    try {
      if (editingMeeting) {
        await meetingAdminRepository.update(editingMeeting.id, {
          generation,
          round,
          type: form.type,
          title,
          meetingDate: form.meetingDate,
          isActive: true,
        });
        toast.success("수정되었습니다.");
      } else {
        await meetingAdminRepository.create({
          generation,
          round,
          type: form.type,
          title,
          meetingDate: form.meetingDate,
          isActive: true,
        });
        toast.success("추가되었습니다.");
      }
      setDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Failed to save meeting:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await meetingAdminRepository.delete(deleteTarget.id);
      toast.success("삭제되었습니다.");
      if (selectedMeeting?.id === deleteTarget.id) {
        setSelectedMeeting(null);
      }
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  /** 회차를 선택하면 기존 출결 기록을 불러옵니다. */
  const handleSelectMeeting = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setAttendanceLoading(true);
    try {
      const records = await attendanceAdminRepository.getByMeetingId(meeting.id);
      const next: Record<string, AttendanceStatus> = {};
      for (const record of records) {
        next[record.memberId] = record.status;
      }
      setStatusMap(next);
    } catch (error) {
      console.error("Failed to fetch attendances:", error);
      toast.error("출결 기록을 불러오는데 실패했습니다.");
      setStatusMap({});
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedMeeting) return;

    setAttendanceSaving(true);
    try {
      // 저장 직전 최신 출결을 다시 읽습니다.
      // 패널을 연 뒤 QR 셀프 체크인으로 들어온 기록을, 운영자가 건드리지
      // 않았다는 이유로 'absent'(=삭제)로 덮어써 지우는 것을 막기 위함입니다.
      const freshRecords = await attendanceAdminRepository.getByMeetingId(
        selectedMeeting.id
      );
      const freshMap: Record<string, AttendanceStatus> = {};
      for (const record of freshRecords) {
        freshMap[record.memberId] = record.status;
      }

      const inputs: AttendanceInput[] = targetMembers.map((member) => ({
        memberId: member.id,
        // 우선순위: 운영자가 명시적으로 고른 값 > 최신 DB 값(셀프 체크인 보존) > absent
        status: statusMap[member.id] ?? freshMap[member.id] ?? "absent",
      }));

      await attendanceAdminRepository.saveMany(
        {
          id: selectedMeeting.id,
          generation: selectedMeeting.generation,
          round: selectedMeeting.round,
        },
        inputs
      );

      // 저장 결과(셀프 체크인 포함)를 화면 상태에도 반영합니다.
      const nextStatus: Record<string, AttendanceStatus> = {};
      for (const input of inputs) {
        if (input.status !== "absent") nextStatus[input.memberId] = input.status;
      }
      setStatusMap(nextStatus);

      toast.success("출결이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save attendances:", error);
      toast.error("출결 저장에 실패했습니다.");
    } finally {
      setAttendanceSaving(false);
    }
  };

  /** 전체 회원을 한 번에 같은 상태로 설정합니다. */
  const setAllStatus = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const member of targetMembers) {
      next[member.id] = status;
    }
    setStatusMap(next);
  };

  const attendedCount = targetMembers.filter((member) => {
    const status = statusMap[member.id] ?? "absent";
    return status === "present" || status === "late";
  }).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 회차 목록 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">정기모임 회차</h2>
            <p className="text-sm text-muted-foreground">
              회차를 선택하면 아래에서 출결을 입력할 수 있습니다.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-1 h-4 w-4" />
            회차 추가
          </Button>
        </div>

        {meetings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            등록된 회차가 없습니다. 회차를 먼저 추가해주세요.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting) => {
              const selected = selectedMeeting?.id === meeting.id;
              return (
                <div
                  key={meeting.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectMeeting(meeting)}
                    className="w-full text-left"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {meeting.generation}기 {meeting.round}회차
                      </span>
                      {!meeting.isActive && (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          집계 제외
                        </span>
                      )}
                      {checkinMeetingId === meeting.id && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          체크인 받는 중
                        </span>
                      )}
                    </div>
                    <p className="truncate font-medium text-foreground">
                      {meeting.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(meeting.meetingDate?.toDate?.() ?? null)}
                    </p>
                  </button>

                  <div className="mt-3 flex justify-end gap-1">
                    <Button
                      variant={
                        checkinMeetingId === meeting.id ? "default" : "ghost"
                      }
                      size="icon"
                      onClick={() => toggleCheckin(meeting)}
                      disabled={checkinToggling}
                      title={
                        checkinMeetingId === meeting.id
                          ? "체크인 닫기"
                          : "체크인 열기"
                      }
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(meeting)}
                      title="수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(meeting)}
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 출결 입력 */}
      {selectedMeeting && (
        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Users className="h-5 w-5 text-primary" />
                {selectedMeeting.title} 출결
              </h2>
              <p className="text-sm text-muted-foreground">
                대상 {targetMembers.length}명 · 참석 {attendedCount}명
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllStatus("present")}
                disabled={attendanceLoading || targetMembers.length === 0}
              >
                전체 출석
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllStatus("absent")}
                disabled={attendanceLoading || targetMembers.length === 0}
              >
                전체 결석
              </Button>
              <Button
                onClick={handleSaveAttendance}
                disabled={attendanceSaving || attendanceLoading || targetMembers.length === 0}
              >
                {attendanceSaving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                출결 저장
              </Button>
            </div>
          </div>

          {attendanceLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : targetMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {selectedMeeting.generation}기에 활동 중인 회원이 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {targetMembers.map((member) => {
                const status = statusMap[member.id] ?? "absent";
                return (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <span className="font-medium text-foreground">
                      {member.memberName}
                    </span>

                    <div className="flex gap-1">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setStatusMap((prev) => ({ ...prev, [member.id]: option }))
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
          )}
        </section>
      )}

      {/* 회차 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMeeting ? "회차 수정" : "회차 추가"}</DialogTitle>
            <DialogDescription>
              정기모임 회차 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="generation">기수 *</Label>
                <Input
                  id="generation"
                  type="number"
                  value={form.generation}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, generation: e.target.value }))
                  }
                  placeholder="예: 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="round">회차 *</Label>
                <Input
                  id="round"
                  type="number"
                  value={form.round}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, round: e.target.value }))
                  }
                  placeholder="예: 3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">회차 종류 *</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, type: value as MeetingType }))
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                제목은 &quot;{form.generation || "N"}기 {form.round || "N"}회차{" "}
                {form.type}&quot;로 자동 생성됩니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label>모임 일자 *</Label>
              <DatePicker
                value={form.meetingDate}
                onChange={(date) =>
                  setForm((prev) => ({ ...prev, meetingDate: date }))
                }
              />
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button onClick={handleSaveMeeting} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="회차 삭제"
        description={`'${deleteTarget?.title ?? ""}' 회차와 해당 회차의 모든 출결 기록이 함께 삭제됩니다. 계속할까요?`}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
