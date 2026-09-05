"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Settings2,
  ExternalLink,
  Search,
  QrCode,
  Download,
  Check,
  X,
  Upload,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/presentation/components/admin";
import {
  memberAdminRepository,
  calculateMemberType,
} from "@/infrastructure/repositories/admin/memberAdminRepository";
import { activityAdminRepository } from "@/infrastructure/repositories/admin/activityAdminRepository";
import { meetingAdminRepository } from "@/infrastructure/repositories/admin/meetingAdminRepository";
import { isRegularMeeting } from "@/domain/meetings/meeting";
import {
  attendanceAdminRepository,
  type MemberAttendanceInput,
} from "@/infrastructure/repositories/admin/attendanceAdminRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import {
  downloadMemberExport,
  downloadMemberTemplate,
  parseMemberWorkbook,
  type AttendanceSheetRow,
  type GrowthLogSheetRow,
  type MeetingColumn,
  type MemberSheetRow,
} from "@/shared/utils/memberBulkExcel";
import {
  ATTENDANCE_STATUS_LABELS,
  type Attendance,
  type AttendanceStatus,
  type GrowthLogActivity,
  type Meeting,
  type Member,
} from "@/domain/entities";

const getSiteUrl = () =>
  typeof window !== "undefined" ? window.location.origin : "";

/**
 * 멤버 식별 키 (기수 + 이름)
 *
 * 엑셀에는 문서 ID가 없으므로, 이 조합으로 기존 멤버를 찾아 덮어씁니다.
 */
const getMemberKey = (generation: number, memberName: string) =>
  `${generation}::${memberName.trim()}`;

/** 성장일지가 특정 회원의 것인지 판정합니다. */
const isLogOfMember = (log: GrowthLogActivity, member: Member) =>
  log.memberId
    ? log.memberId === member.id
    : log.authorName === member.memberName &&
      log.generation === member.generation;

/** 업로드 미리보기에 표시할 멤버 행 */
interface BulkMemberPreview extends MemberSheetRow {
  /** 기존 멤버 문서 ID (없으면 신규 등록) */
  existingId: string | null;
}

/** 업로드 미리보기에 표시할 성장일지 행 */
interface BulkLogPreview extends GrowthLogSheetRow {
  /** 기존 성장일지 문서 ID (없으면 신규 등록) */
  existingLogId: string | null;
  /** 회차 번호로 찾은 정기모임 문서 ID (없으면 미지정) */
  meetingId: string;
}

/** 업로드 미리보기에 표시할 출결 행 (한 멤버) */
interface BulkAttendancePreview {
  memberName: string;
  generation: number;
  /** 실제로 반영할 회차별 출결 (회차 문서를 찾은 것만) */
  inputs: MemberAttendanceInput[];
  /** 상태별 건수 (요약 표시용) */
  counts: Record<AttendanceStatus, number>;
  /** 등록된 회차를 찾지 못해 제외한 셀 수 */
  unmatchedCells: number;
}

/** 출결 상태별 건수를 셉니다. */
const countByStatus = (
  inputs: readonly MemberAttendanceInput[]
): Record<AttendanceStatus, number> => {
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    late: 0,
    excused: 0,
    absent: 0,
  };
  for (const input of inputs) counts[input.status]++;
  return counts;
};

/**
 * 멤버 관리 페이지
 */
export default function MembersPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGeneration, setCurrentGeneration] = useState(0);

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    generation: "",
    memberName: "",
    isActive: true,
  });

  // QR코드 상태
  const [qrItem, setQrItem] = useState<Member | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 엑셀 일괄 등록 상태
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkParsing, setBulkParsing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [bulkMembers, setBulkMembers] = useState<BulkMemberPreview[]>([]);
  const [bulkLogs, setBulkLogs] = useState<BulkLogPreview[]>([]);
  const [bulkAttendance, setBulkAttendance] = useState<BulkAttendancePreview[]>([]);
  /** 멤버 시트에도 없고 기존 멤버에도 없어 연결할 수 없는 성장일지 */
  const [orphanLogs, setOrphanLogs] = useState<GrowthLogSheetRow[]>([]);
  /** 연결할 멤버를 찾지 못한 출결 행 */
  const [orphanAttendance, setOrphanAttendance] = useState<AttendanceSheetRow[]>(
    []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [members, siteConfig] = await Promise.all([
        memberAdminRepository.getAll(),
        siteConfigRepository.getSiteConfig(),
      ]);
      setItems(members);
      setCurrentGeneration(siteConfig?.currentGeneration ?? 0);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      toast.error("목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm({ generation: "", memberName: "", isActive: true });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Member) => {
    setEditingItem(item);
    setForm({
      generation: String(item.generation),
      memberName: item.memberName,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.generation || !form.memberName) {
      toast.error("이름과 기수를 입력해주세요.");
      return;
    }

    const generation = Number(form.generation);
    const memberType = calculateMemberType(currentGeneration, generation);

    setSaving(true);
    try {
      if (editingItem) {
        await memberAdminRepository.update(editingItem.id, {
          generation,
          memberName: form.memberName,
          memberType,
          isActive: form.isActive,
        });
        toast.success("수정되었습니다.");
      } else {
        await memberAdminRepository.create({
          generation,
          memberName: form.memberName,
          memberType,
          isActive: form.isActive,
        });
        toast.success("추가되었습니다.");
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getMemberUrl = (item: Member) =>
    `${getSiteUrl()}/member/${item.generation}/${encodeURIComponent(item.memberName)}`;

  const openQrDialog = async (item: Member) => {
    setQrItem(item);
    const url = getMemberUrl(item);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
  };

  const downloadQr = () => {
    if (!qrItem || !qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${qrItem.generation}기-${qrItem.memberName}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await memberAdminRepository.delete(deleteTarget.id);
      toast.success("삭제되었습니다.");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // ===== 엑셀 =====

  /**
   * 엑셀 작업에 필요한 부수 데이터를 한 번에 불러옵니다.
   *
   * 내보내기와 업로드 미리보기가 같은 데이터를 필요로 합니다.
   */
  const fetchExcelContext = async (): Promise<{
    growthLogs: GrowthLogActivity[];
    meetings: Meeting[];
    attendances: Attendance[];
  }> => {
    const [activities, allMeetings, attendances] = await Promise.all([
      activityAdminRepository.getAllActivities(),
      meetingAdminRepository.getAll(),
      attendanceAdminRepository.getAll(),
    ]);
    // 출결 엑셀은 정기모임만 다룹니다(그로스톡은 별도 집계).
    const meetings = allMeetings.filter((meeting) =>
      isRegularMeeting(meeting.type)
    );
    const growthLogs = activities.filter(
      (activity): activity is GrowthLogActivity =>
        activity.category === "growth-log"
    );
    return { growthLogs, meetings, attendances };
  };

  /** 등록된 정기모임을 출결 시트의 회차 컬럼으로 변환합니다. */
  const toMeetingColumns = (meetings: readonly Meeting[]): MeetingColumn[] =>
    meetings.map((meeting) => ({
      generation: meeting.generation,
      round: meeting.round,
    }));

  /**
   * 예시가 채워진 빈 양식을 내려받습니다.
   *
   * 출결 시트의 회차 컬럼은 등록된 정기모임에서 만들어야 하므로
   * 회차 목록을 먼저 조회합니다.
   */
  const handleTemplateDownload = async () => {
    setTemplateDownloading(true);
    try {
      const allMeetings = await meetingAdminRepository.getAll();
      // 출결 시트 회차 컬럼은 정기모임만(그로스톡 제외)
      const meetings = allMeetings.filter((meeting) =>
        isRegularMeeting(meeting.type)
      );
      downloadMemberTemplate(toMeetingColumns(meetings));
    } catch (error) {
      console.error("Failed to download template:", error);
      toast.error("양식을 내려받지 못했습니다.");
    } finally {
      setTemplateDownloading(false);
    }
  };

  /**
   * 현재 등록된 멤버·성장일지·출결을 채운 엑셀을 내려받습니다.
   *
   * 내려받아 수정한 뒤 그대로 다시 업로드하면 기존 정보가 갱신됩니다.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const { growthLogs, meetings, attendances } = await fetchExcelContext();

      const memberRows: MemberSheetRow[] = items.map((item) => ({
        memberName: item.memberName,
        generation: item.generation,
        isActive: item.isActive,
        field: item.field ?? "",
        bio: item.bio ?? "",
        profileImageUrl: item.profileImageUrl ?? "",
      }));

      const logRows: GrowthLogSheetRow[] = [];
      for (const member of items) {
        for (const log of growthLogs) {
          if (!isLogOfMember(log, member)) continue;
          logRows.push({
            memberName: member.memberName,
            generation: member.generation,
            blogUrl: log.blogUrl ?? "",
            title: log.title ?? "",
            field: log.field ?? "",
            excerpt: log.excerpt ?? "",
            round: log.round ?? 0,
            thumbnailUrl: log.thumbnailUrl ?? "",
            showOnHome: log.showOnHome === true,
          });
        }
      }

      // 출결은 회원 문서 ID로 연결되므로 ID 기준으로 모아둡니다.
      const statusByMemberAndMeeting = new Map<string, AttendanceStatus>();
      for (const attendance of attendances) {
        statusByMemberAndMeeting.set(
          `${attendance.memberId}::${attendance.meetingId}`,
          attendance.status
        );
      }

      const attendanceRows: AttendanceSheetRow[] = items.map((member) => ({
        memberName: member.memberName,
        generation: member.generation,
        cells: meetings
          // 정회원도 이후 기수 정기모임에 참석하므로 가입 기수 이상을 모두 담습니다.
          .filter((meeting) => meeting.generation >= member.generation)
          .map((meeting) => ({
            meetingGeneration: meeting.generation,
            round: meeting.round,
            // 기록이 없으면 결석입니다. 빈 칸으로 두면 "미입력"과 구분되지
            // 않으므로 결석을 명시해 내보냅니다.
            status:
              statusByMemberAndMeeting.get(`${member.id}::${meeting.id}`) ??
              "absent",
          })),
      }));

      const today = new Date().toISOString().slice(0, 10);
      downloadMemberExport(
        {
          members: memberRows,
          growthLogs: logRows,
          attendance: attendanceRows,
          meetingColumns: toMeetingColumns(meetings),
        },
        `멤버_현황_${today}.xlsx`
      );
      toast.success(
        `멤버 ${memberRows.length}명, 성장일지 ${logRows.length}편, 회차 ${meetings.length}개를 내보냈습니다.`
      );
    } catch (error) {
      console.error("Failed to export members:", error);
      toast.error("내보내기에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  };

  const handleExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 선택할 수 있도록 즉시 초기화합니다.
    e.target.value = "";
    if (!file) return;

    setBulkParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseMemberWorkbook(new Uint8Array(buffer));

      if (
        parsed.members.length === 0 &&
        parsed.growthLogs.length === 0 &&
        parsed.attendance.length === 0
      ) {
        toast.error("유효한 데이터가 없습니다. 엑셀 양식을 확인해주세요.");
        return;
      }

      const { growthLogs, meetings } = await fetchExcelContext();
      const memberByKey = new Map(
        items.map((item) => [
          getMemberKey(item.generation, item.memberName),
          item,
        ])
      );

      const memberPreviews: BulkMemberPreview[] = parsed.members.map((row) => ({
        ...row,
        existingId:
          memberByKey.get(getMemberKey(row.generation, row.memberName))?.id ??
          null,
      }));

      // 이번 업로드로 새로 생기는 멤버도 성장일지 연결 대상으로 인정합니다.
      const sheetMemberKeys = new Set(
        memberPreviews.map((row) => getMemberKey(row.generation, row.memberName))
      );

      const logPreviews: BulkLogPreview[] = [];
      const unmatchedLogs: GrowthLogSheetRow[] = [];

      for (const row of parsed.growthLogs) {
        const key = getMemberKey(row.generation, row.memberName);
        const existingMember = memberByKey.get(key) ?? null;

        if (!existingMember && !sheetMemberKeys.has(key)) {
          unmatchedLogs.push(row);
          continue;
        }

        const meeting = meetings.find(
          (item) => item.generation === row.generation && item.round === row.round
        );
        // 신규 멤버의 일지는 아직 문서가 없으므로 항상 새로 등록됩니다.
        const existingLog = existingMember
          ? growthLogs.find(
              (log) =>
                isLogOfMember(log, existingMember) && log.blogUrl === row.blogUrl
            )
          : undefined;

        logPreviews.push({
          ...row,
          existingLogId: existingLog?.id ?? null,
          meetingId: meeting?.id ?? "",
        });
      }

      const attendancePreviews: BulkAttendancePreview[] = [];
      const unmatchedAttendance: AttendanceSheetRow[] = [];

      for (const row of parsed.attendance) {
        const key = getMemberKey(row.generation, row.memberName);
        if (!memberByKey.has(key) && !sheetMemberKeys.has(key)) {
          unmatchedAttendance.push(row);
          continue;
        }

        const inputs: MemberAttendanceInput[] = [];
        let unmatchedCells = 0;

        for (const cell of row.cells) {
          // 가입 이전 기수의 회차는 참석 대상이 아니었으므로 반영하지 않습니다.
          if (cell.meetingGeneration < row.generation) {
            unmatchedCells++;
            continue;
          }

          const meeting = meetings.find(
            (item) =>
              item.generation === cell.meetingGeneration &&
              item.round === cell.round
          );
          if (!meeting) {
            unmatchedCells++;
            continue;
          }

          inputs.push({
            meetingId: meeting.id,
            generation: meeting.generation,
            round: meeting.round,
            status: cell.status,
          });
        }

        if (inputs.length === 0 && unmatchedCells === 0) continue;

        attendancePreviews.push({
          memberName: row.memberName,
          generation: row.generation,
          inputs,
          counts: countByStatus(inputs),
          unmatchedCells,
        });
      }

      setBulkMembers(memberPreviews);
      setBulkLogs(logPreviews);
      setBulkAttendance(attendancePreviews);
      setOrphanLogs(unmatchedLogs);
      setOrphanAttendance(unmatchedAttendance);
      setBulkDialogOpen(true);

      const skipped = parsed.skippedMemberRows + parsed.skippedGrowthLogRows;
      if (skipped > 0) {
        toast.warning(`필수값이 비어 ${skipped}개 행을 건너뛰었습니다.`);
      }
      if (parsed.invalidAttendanceCells > 0) {
        toast.warning(
          `출결 값으로 인식할 수 없는 칸 ${parsed.invalidAttendanceCells}개를 건너뛰었습니다.`
        );
      }
    } catch (error) {
      console.error("Failed to parse excel:", error);
      toast.error("엑셀 파일을 읽지 못했습니다.");
    } finally {
      setBulkParsing(false);
    }
  };

  const closeBulkDialog = () => {
    setBulkDialogOpen(false);
    setBulkMembers([]);
    setBulkLogs([]);
    setBulkAttendance([]);
    setOrphanLogs([]);
    setOrphanAttendance([]);
  };

  const handleBulkUpload = async () => {
    if (
      bulkMembers.length === 0 &&
      bulkLogs.length === 0 &&
      bulkAttendance.length === 0
    ) {
      return;
    }

    setBulkUploading(true);

    // 성장일지를 연결하려면 멤버 문서 ID가 필요하므로 멤버부터 처리합니다.
    const memberIdByKey = new Map(
      items.map((item) => [getMemberKey(item.generation, item.memberName), item.id])
    );

    let memberCreated = 0;
    let memberUpdated = 0;
    let memberFailed = 0;

    for (const row of bulkMembers) {
      const key = getMemberKey(row.generation, row.memberName);
      const memberType = calculateMemberType(currentGeneration, row.generation);

      try {
        if (row.existingId) {
          await memberAdminRepository.update(row.existingId, {
            memberName: row.memberName,
            generation: row.generation,
            memberType,
            isActive: row.isActive,
            bio: row.bio,
            field: row.field,
            // 이미지 주소는 엑셀에서 다루기 번거로우므로, 빈 칸은
            // "지우기"가 아니라 "그대로 두기"로 해석합니다.
            // (텍스트 필드는 엑셀에서 바로 지울 수 있어 빈 값을 그대로 반영합니다)
            ...(row.profileImageUrl
              ? { profileImageUrl: row.profileImageUrl }
              : {}),
          });
          memberIdByKey.set(key, row.existingId);
          memberUpdated++;
        } else {
          const createdId = await memberAdminRepository.create({
            memberName: row.memberName,
            generation: row.generation,
            memberType,
            isActive: row.isActive,
            bio: row.bio,
            field: row.field,
            profileImageUrl: row.profileImageUrl,
          });
          memberIdByKey.set(key, createdId);
          memberCreated++;
        }
      } catch (error) {
        console.error(`Failed to save member ${row.memberName}:`, error);
        memberFailed++;
      }
    }

    let logCreated = 0;
    let logUpdated = 0;
    let logFailed = 0;

    for (const row of bulkLogs) {
      const memberId = memberIdByKey.get(
        getMemberKey(row.generation, row.memberName)
      );
      if (!memberId) {
        // 멤버 저장이 실패한 경우입니다.
        logFailed++;
        continue;
      }

      // 회차를 못 찾으면 미지정으로 저장해, 존재하지 않는 회차가 남지 않게 합니다.
      const round = row.meetingId ? row.round : 0;

      try {
        if (row.existingLogId) {
          await activityAdminRepository.updateGrowthLog(row.existingLogId, {
            generation: row.generation,
            showOnHome: row.showOnHome,
            title: row.title,
            field: row.field,
            authorName: row.memberName,
            memberId,
            meetingId: row.meetingId,
            round,
            excerpt: row.excerpt,
            blogUrl: row.blogUrl,
            // 프로필 이미지와 같은 이유로 빈 썸네일은 기존 값을 유지합니다.
            ...(row.thumbnailUrl ? { thumbnailUrl: row.thumbnailUrl } : {}),
          });
          logUpdated++;
        } else {
          await activityAdminRepository.addGrowthLog({
            thumbnailUrl: row.thumbnailUrl,
            generation: row.generation,
            order: 0,
            isActive: true,
            showOnHome: row.showOnHome,
            title: row.title,
            field: row.field,
            authorName: row.memberName,
            memberId,
            meetingId: row.meetingId,
            round,
            excerpt: row.excerpt,
            blogUrl: row.blogUrl,
          });
          logCreated++;
        }
      } catch (error) {
        console.error(`Failed to save growth log ${row.blogUrl}:`, error);
        logFailed++;
      }
    }

    let attendanceSaved = 0;
    let attendanceMembers = 0;
    let attendanceFailed = 0;

    for (const row of bulkAttendance) {
      if (row.inputs.length === 0) continue;

      const memberId = memberIdByKey.get(
        getMemberKey(row.generation, row.memberName)
      );
      if (!memberId) {
        attendanceFailed += row.inputs.length;
        continue;
      }

      try {
        // 한 회원의 여러 회차를 배치 한 번으로 저장합니다.
        // ("결석"은 리포지토리가 문서 삭제로 처리합니다)
        await attendanceAdminRepository.saveManyForMember(memberId, row.inputs);
        attendanceSaved += row.inputs.length;
        attendanceMembers++;
      } catch (error) {
        console.error(`Failed to save attendance for ${row.memberName}:`, error);
        attendanceFailed += row.inputs.length;
      }
    }

    setBulkUploading(false);
    closeBulkDialog();

    const summary = [
      memberCreated > 0 ? `멤버 ${memberCreated}명 등록` : "",
      memberUpdated > 0 ? `멤버 ${memberUpdated}명 수정` : "",
      logCreated > 0 ? `성장일지 ${logCreated}편 등록` : "",
      logUpdated > 0 ? `성장일지 ${logUpdated}편 수정` : "",
      attendanceSaved > 0
        ? `출결 ${attendanceMembers}명 ${attendanceSaved}건 반영`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    const failed = memberFailed + logFailed + attendanceFailed;
    if (failed > 0) {
      toast.warning(`${summary || "처리된 항목 없음"} · ${failed}건 실패`);
    } else {
      toast.success(`${summary || "변경된 항목이 없습니다."}`);
    }

    fetchData();
  };

  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(item.generation).includes(searchQuery) ||
          item.memberType.includes(searchQuery)
      )
    : items;

  // 미리보기 요약 (신규/수정 건수)
  const updatedMemberCount = bulkMembers.filter((row) => row.existingId).length;
  const newMemberCount = bulkMembers.length - updatedMemberCount;
  const updatedLogCount = bulkLogs.filter((row) => row.existingLogId).length;
  const newLogCount = bulkLogs.length - updatedLogCount;
  const attendanceCellCount = bulkAttendance.reduce(
    (sum, row) => sum + row.inputs.length,
    0
  );
  const attendanceUnmatchedCount = bulkAttendance.reduce(
    (sum, row) => sum + row.unmatchedCells,
    0
  );

  const previewMemberType =
    form.generation && currentGeneration
      ? calculateMemberType(currentGeneration, Number(form.generation))
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {items.length}명의 멤버 (현재 {currentGeneration}기)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTemplateDownload}
            disabled={templateDownloading}
          >
            {templateDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            양식 다운로드
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || items.length === 0}
            title="현재 등록된 멤버 정보와 성장일지, 출결을 엑셀로 내려받습니다"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            현황 내보내기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkParsing}
          >
            {bulkParsing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            엑셀 일괄 등록
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleExcelFile}
          />
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            멤버 추가
          </Button>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름, 기수, 회원구분으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 목록 */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "검색 결과가 없습니다." : "등록된 멤버가 없습니다."}
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 hover:bg-gray-6 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{item.generation}기</Badge>
                <Badge
                  variant={item.memberType === "신입회원" ? "default" : "outline"}
                >
                  {item.memberType}
                </Badge>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.memberName}</p>
                    {item.isActive ? (
                      <Check className="h-4 w-4 text-green-1" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button asChild variant="outline" size="sm" title="상세 관리">
                  <Link href={`/admin/members/${item.id}`}>
                    <Settings2 className="mr-1 h-4 w-4" />
                    상세 관리
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openQrDialog(item)}
                  title="QR코드"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(item)}
                  title="수정"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(item)}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "멤버 수정" : "멤버 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberName">멤버 이름 *</Label>
              <Input
                id="memberName"
                value={form.memberName}
                onChange={(e) => setForm({ ...form, memberName: e.target.value })}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generation">가입 기수 *</Label>
              <Input
                id="generation"
                type="number"
                min={1}
                value={form.generation}
                onChange={(e) => setForm({ ...form, generation: e.target.value })}
                placeholder="5"
              />
              {previewMemberType && (
                <p className="text-xs text-muted-foreground">
                  회원 구분: <Badge variant="outline" className="text-xs ml-1">{previewMemberType}</Badge>
                  <span className="ml-2">
                    (현재 {currentGeneration}기 - 가입 {form.generation}기 = 차이 {currentGeneration - Number(form.generation)})
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="isActive">가입 여부</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR코드 다이얼로그 */}
      <Dialog open={!!qrItem} onOpenChange={(open) => !open && setQrItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {qrItem?.generation}기 {qrItem?.memberName} QR코드
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-64 h-64 rounded-lg border"
              />
            )}
            {/* QR이 가리키는 업적 페이지를 새 탭에서 바로 확인할 수 있게 합니다. */}
            {qrItem && (
              <a
                href={getMemberUrl(qrItem)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground text-center break-all underline underline-offset-2 hover:text-primary transition-colors"
              >
                {getMemberUrl(qrItem)}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}
            <p className="text-xs text-muted-foreground">
              클릭하면 회원 업적 페이지가 열립니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrItem(null)}>
              닫기
            </Button>
            <Button onClick={downloadQr}>
              <Download className="mr-2 h-4 w-4" />
              PNG 다운로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 엑셀 일괄 등록 미리보기 다이얼로그 */}
      <Dialog
        open={bulkDialogOpen}
        onOpenChange={(open) => !open && closeBulkDialog()}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>엑셀 일괄 등록 미리보기</DialogTitle>
            <DialogDescription>
              {[
                newMemberCount > 0 ? `멤버 ${newMemberCount}명 신규` : "",
                updatedMemberCount > 0 ? `멤버 ${updatedMemberCount}명 수정` : "",
                newLogCount > 0 ? `성장일지 ${newLogCount}편 신규` : "",
                updatedLogCount > 0 ? `성장일지 ${updatedLogCount}편 수정` : "",
                attendanceCellCount > 0
                  ? `출결 ${bulkAttendance.length}명 ${attendanceCellCount}건`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ") || "반영할 항목이 없습니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[52vh] space-y-4 overflow-y-auto">
            {/* 멤버 */}
            {bulkMembers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">멤버 {bulkMembers.length}명</p>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-6">
                      <tr>
                        <th className="p-2 text-left font-medium">#</th>
                        <th className="p-2 text-left font-medium">구분</th>
                        <th className="p-2 text-left font-medium">이름</th>
                        <th className="p-2 text-left font-medium">기수</th>
                        <th className="p-2 text-left font-medium">회원 구분</th>
                        <th className="p-2 text-left font-medium">기술 분야</th>
                        <th className="p-2 text-left font-medium">한 줄 소개</th>
                        <th className="p-2 text-left font-medium">프로필</th>
                        <th className="p-2 text-left font-medium">가입</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bulkMembers.map((row, i) => {
                        const memberType = calculateMemberType(
                          currentGeneration,
                          row.generation
                        );
                        return (
                          <tr key={i} className="hover:bg-gray-6/50">
                            <td className="p-2 text-muted-foreground">{i + 1}</td>
                            <td className="p-2">
                              <Badge
                                variant={row.existingId ? "outline" : "default"}
                                className="text-xs"
                              >
                                {row.existingId ? "수정" : "신규"}
                              </Badge>
                            </td>
                            <td className="p-2 font-medium">{row.memberName}</td>
                            <td className="p-2">{row.generation}기</td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  memberType === "신입회원" ? "default" : "outline"
                                }
                                className="text-xs"
                              >
                                {memberType}
                              </Badge>
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {row.field || "-"}
                            </td>
                            <td className="max-w-[220px] truncate p-2 text-muted-foreground">
                              {row.bio || "-"}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {row.profileImageUrl ? "있음" : "-"}
                            </td>
                            <td className="p-2">
                              {row.isActive ? (
                                <Check className="h-4 w-4 text-green-1" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 성장일지 */}
            {bulkLogs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  성장일지 {bulkLogs.length}편
                </p>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-6">
                      <tr>
                        <th className="p-2 text-left font-medium">#</th>
                        <th className="p-2 text-left font-medium">구분</th>
                        <th className="p-2 text-left font-medium">멤버</th>
                        <th className="p-2 text-left font-medium">제목</th>
                        <th className="p-2 text-left font-medium">분야</th>
                        <th className="p-2 text-left font-medium">회차</th>
                        <th className="p-2 text-left font-medium">홈 노출</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bulkLogs.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-6/50">
                          <td className="p-2 text-muted-foreground">{i + 1}</td>
                          <td className="p-2">
                            <Badge
                              variant={row.existingLogId ? "outline" : "default"}
                              className="text-xs"
                            >
                              {row.existingLogId ? "수정" : "신규"}
                            </Badge>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {row.generation}기 {row.memberName}
                          </td>
                          <td className="max-w-[260px] truncate p-2 font-medium">
                            {row.title}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {row.field || "-"}
                          </td>
                          <td className="p-2 whitespace-nowrap text-muted-foreground">
                            {row.meetingId ? (
                              `${row.round}회차`
                            ) : (
                              <span title="해당 기수에 그 회차가 없어 미지정으로 저장됩니다">
                                미지정
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {row.showOnHome ? (
                              <Check className="h-4 w-4 text-green-1" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 출결 */}
            {bulkAttendance.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  출결 {bulkAttendance.length}명 · {attendanceCellCount}건
                  {attendanceUnmatchedCount > 0 && (
                    <span
                      className="ml-2 text-xs font-normal text-destructive"
                      title="등록된 회차가 없거나 자기 기수가 아닌 칸입니다"
                    >
                      제외 {attendanceUnmatchedCount}칸
                    </span>
                  )}
                </p>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-6">
                      <tr>
                        <th className="p-2 text-left font-medium">#</th>
                        <th className="p-2 text-left font-medium">멤버</th>
                        <th className="p-2 text-left font-medium">반영 건수</th>
                        <th className="p-2 text-left font-medium">내역</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bulkAttendance.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-6/50">
                          <td className="p-2 text-muted-foreground">{i + 1}</td>
                          <td className="p-2 whitespace-nowrap font-medium">
                            {row.generation}기 {row.memberName}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {row.inputs.length}건
                            {row.unmatchedCells > 0 && (
                              <span className="ml-1 text-xs text-destructive">
                                (제외 {row.unmatchedCells})
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {(
                              Object.entries(row.counts) as [
                                AttendanceStatus,
                                number,
                              ][]
                            )
                              .filter(([, count]) => count > 0)
                              .map(
                                ([status, count]) =>
                                  `${ATTENDANCE_STATUS_LABELS[status]} ${count}`
                              )
                              .join(" · ") || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  결석은 기록을 남기지 않는 설계라, &quot;결석&quot;으로 반영하면 기존
                  출석 기록이 삭제됩니다. 빈 칸은 그대로 둡니다.
                </p>
              </div>
            )}

            {/* 연결할 멤버를 찾지 못한 성장일지 */}
            {orphanLogs.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive">
                  연결할 멤버를 찾지 못해 제외된 성장일지 {orphanLogs.length}편
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  멤버 목록 시트나 기존 멤버 중에 같은 이름·기수가 없습니다.
                </p>
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {orphanLogs.map((row, i) => (
                    <li key={i} className="truncate">
                      {row.generation}기 {row.memberName} · {row.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 연결할 멤버를 찾지 못한 출결 */}
            {orphanAttendance.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive">
                  연결할 멤버를 찾지 못해 제외된 출결 {orphanAttendance.length}명
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  멤버 목록 시트나 기존 멤버 중에 같은 이름·기수가 없습니다.
                </p>
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {orphanAttendance.map((row, i) => (
                    <li key={i} className="truncate">
                      {row.generation}기 {row.memberName} · {row.cells.length}건
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeBulkDialog}>
              취소
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={
                bulkUploading ||
                (bulkMembers.length === 0 &&
                  bulkLogs.length === 0 &&
                  attendanceCellCount === 0)
              }
            >
              {bulkUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bulkUploading ? "반영 중..." : "일괄 반영"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="멤버 삭제"
        description={`${deleteTarget?.generation}기 ${deleteTarget?.memberName}을(를) 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
