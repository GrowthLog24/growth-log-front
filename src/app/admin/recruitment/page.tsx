"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Trash2,
  ArrowUpDown,
  Users,
  ChevronDown,
  ChevronRight,
  FileText,
  Bell,
  Calendar as CalendarIcon,
  Mail,
  Phone,
  CreditCard,
  Clock,
  Plus,
  Pencil,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DataTable, Column, ConfirmDialog } from "@/presentation/components/admin";
import { MarkdownEditor } from "@/presentation/components/common";
import { recruitmentAdminRepository } from "@/infrastructure/repositories/admin/recruitmentAdminRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import type { PreRegistration, PreRegistrationField, Recruitment, OTSchedule } from "@/domain/entities";

type SortField = "submittedAt" | "name";
type SortOrder = "asc" | "desc";

/**
 * 모집/사전등록 신청 통합 관리 페이지
 */
export default function RecruitmentPage() {
  // 현재 기수 (siteConfig에서 가져옴)
  const [currentGeneration, setCurrentGeneration] = useState(0);

  // 모집 설정 상태
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false);
  const [recruitmentGeneration, setRecruitmentGeneration] = useState(0);
  const [recruitmentFormLink, setRecruitmentFormLink] = useState("");

  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogGeneration, setDialogGeneration] = useState(0);
  const [dialogFormLink, setDialogFormLink] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [generationConfirmOpen, setGenerationConfirmOpen] = useState(false);

  // 사전등록 신청 목록 상태
  const [registrations, setRegistrations] = useState<PreRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // 필터/검색/정렬 상태
  const [filterGeneration, setFilterGeneration] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("submittedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [availableGenerations, setAvailableGenerations] = useState<number[]>([]);

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<PreRegistration | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 모집 종료 확인 다이얼로그 상태
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // 폼 필드
  const [formFields, setFormFields] = useState<PreRegistrationField[]>([]);

  // 모집 상세 정보 상태
  const [recruitmentDetail, setRecruitmentDetail] = useState<Recruitment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailForm, setDetailForm] = useState<{
    // 섹션 1: 신입회원 가입 안내
    deadlineAt: Date | undefined;
    applyGuideMd: string;
    // 섹션 2: OT 안내
    otLocationMd: string;
    otGuideMd: string;
    // 섹션 3: 등록 입금 안내
    feeAmount: number;
    feeDetailMd: string;
    bankAccountText: string;
    feeDescriptionMd: string;
    // 섹션 4: 정기 모임 안내
    firstMeetingAt: Date | undefined;
    regularMeetingsMd: string;
    activityScheduleMd: string;
    meetingGuideMd: string;
    // 기타
    contactEmail: string;
    kakaoMessageTemplate: string;
  }>({
    deadlineAt: undefined,
    applyGuideMd: "",
    otLocationMd: "",
    otGuideMd: "",
    feeAmount: 0,
    feeDetailMd: "",
    bankAccountText: "",
    feeDescriptionMd: "",
    firstMeetingAt: undefined,
    regularMeetingsMd: "",
    activityScheduleMd: "",
    meetingGuideMd: "",
    contactEmail: "",
    kakaoMessageTemplate: "",
  });

  // OT 일정 다이얼로그 상태
  const [otDialogOpen, setOtDialogOpen] = useState(false);
  const [editingOt, setEditingOt] = useState<OTSchedule | null>(null);
  const [otForm, setOtForm] = useState<{
    round: number;
    dateAt: Date | undefined;
    timeText: string;
    locationText: string;
    note: string;
  }>({
    round: 1,
    dateAt: undefined,
    timeText: "",
    locationText: "",
    note: "",
  });
  const [otSaving, setOtSaving] = useState(false);
  const [deleteOtTarget, setDeleteOtTarget] = useState<OTSchedule | null>(null);
  const [deletingOt, setDeletingOt] = useState(false);

  // 모집 설정 및 현재 기수 로드
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settings, siteConfig] = await Promise.all([
          recruitmentAdminRepository.getRecruitmentSettings(),
          siteConfigRepository.getSiteConfig(),
        ]);

        if (settings) {
          setIsRecruitmentOpen(settings.isOpen);
          setRecruitmentGeneration(settings.generation);
          setRecruitmentFormLink(settings.formLink);
        }

        if (siteConfig) {
          setCurrentGeneration(siteConfig.currentGeneration || 0);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error("설정을 불러오는데 실패했습니다.");
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 폼 필드 로드
  useEffect(() => {
    const fetchFormFields = async () => {
      try {
        const fields = await recruitmentAdminRepository.getPreRegistrationFormFields();
        setFormFields(fields);
      } catch (error) {
        console.error("Failed to fetch form fields:", error);
      }
    };
    fetchFormFields();
  }, []);

  // 모집 상세 정보 로드
  const fetchRecruitmentDetail = async (generation: number) => {
    setDetailLoading(true);
    try {
      const detail = await recruitmentAdminRepository.getRecruitmentDetail(generation);
      setRecruitmentDetail(detail);
      if (detail) {
        setDetailForm({
          // 섹션 1: 신입회원 가입 안내
          deadlineAt: detail.deadlineAt?.toDate?.() || undefined,
          applyGuideMd: detail.applyGuideMd || "",
          // 섹션 2: OT 안내
          otLocationMd: detail.otLocationMd || "",
          otGuideMd: detail.otGuideMd || "",
          // 섹션 3: 등록 입금 안내
          feeAmount: detail.feeAmount || 0,
          feeDetailMd: detail.feeDetailMd || "",
          bankAccountText: detail.bankAccountText || "",
          feeDescriptionMd: detail.feeDescriptionMd || "",
          // 섹션 4: 정기 모임 안내
          firstMeetingAt: detail.firstMeetingAt?.toDate?.() || undefined,
          regularMeetingsMd: detail.regularMeetingsMd || "",
          activityScheduleMd: detail.activityScheduleMd || "",
          meetingGuideMd: detail.meetingGuideMd || "",
          // 기타
          contactEmail: detail.contactEmail || "",
          kakaoMessageTemplate: detail.kakaoMessageTemplate || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch recruitment detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 모집 중일 때 상세 정보 로드
  useEffect(() => {
    if (isRecruitmentOpen && recruitmentGeneration > 0) {
      fetchRecruitmentDetail(recruitmentGeneration);
    }
  }, [isRecruitmentOpen, recruitmentGeneration]);

  // 필드 ID -> 라벨 매핑
  const fieldLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    formFields.forEach((field) => {
      map[field.id] = field.label;
    });
    return map;
  }, [formFields]);

  // 사전등록 신청 목록 로드
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const [regs, generations] = await Promise.all([
        recruitmentAdminRepository.getPreRegistrations({
          generation: filterGeneration !== "all" ? parseInt(filterGeneration) : undefined,
          sortBy: sortField,
          sortOrder: sortOrder,
        }),
        recruitmentAdminRepository.getAvailableGenerations(),
      ]);
      setRegistrations(regs);
      setAvailableGenerations(generations);
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
      toast.error("사전등록 신청 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filterGeneration, sortField, sortOrder]);

  // 검색 필터링 (클라이언트 사이드)
  const filteredRegistrations = useMemo(() => {
    if (!searchQuery.trim()) return registrations;
    const query = searchQuery.toLowerCase();
    return registrations.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.seq.toString().includes(query)
    );
  }, [registrations, searchQuery]);

  // 다음 모집 기수 (현재 기수 + 1)
  const nextGeneration = currentGeneration + 1;

  // 모집 스위치 핸들러
  const handleRecruitmentSwitch = (checked: boolean) => {
    if (checked) {
      // ON으로 변경 시 다이얼로그 열기
      setDialogGeneration(nextGeneration);
      setDialogFormLink("");
      setOpenDialog(true);
    } else {
      // OFF로 변경 시 확인 다이얼로그 열기
      setCloseConfirmOpen(true);
    }
  };

  // 모집 시작 버튼 클릭
  const handleOpenRecruitmentClick = () => {
    if (!dialogGeneration || dialogGeneration < 1) {
      toast.error("모집 기수를 입력해주세요.");
      return;
    }
    if (!dialogFormLink.trim()) {
      toast.error("구글폼 링크를 입력해주세요.");
      return;
    }

    // 다음 기수가 아니면 확인 다이얼로그 표시
    if (dialogGeneration !== nextGeneration) {
      setGenerationConfirmOpen(true);
    } else {
      handleOpenRecruitment();
    }
  };

  // 모집 시작 실행
  const handleOpenRecruitment = async () => {
    setDialogLoading(true);
    try {
      await recruitmentAdminRepository.openRecruitment(
        dialogGeneration,
        dialogFormLink.trim()
      );
      setIsRecruitmentOpen(true);
      setRecruitmentGeneration(dialogGeneration);
      setRecruitmentFormLink(dialogFormLink.trim());
      setOpenDialog(false);
      setGenerationConfirmOpen(false);
      toast.success(`${dialogGeneration}기 모집이 시작되었습니다.`);
    } catch (error) {
      console.error("Failed to open recruitment:", error);
      toast.error("모집 시작에 실패했습니다.");
    } finally {
      setDialogLoading(false);
    }
  };

  // 모집 종료
  const handleCloseRecruitment = async () => {
    setClosing(true);
    try {
      await recruitmentAdminRepository.closeRecruitment();
      setIsRecruitmentOpen(false);
      setCloseConfirmOpen(false);
      toast.success("모집이 종료되었습니다.");
    } catch (error) {
      console.error("Failed to close recruitment:", error);
      toast.error("모집 종료에 실패했습니다.");
    } finally {
      setClosing(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await recruitmentAdminRepository.deletePreRegistration(deleteTarget.id);
      toast.success("사전등록 신청이 삭제되었습니다.");
      setDeleteTarget(null);
      fetchRegistrations();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 정렬 토글
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // 모집 상세 정보 저장
  const handleSaveDetail = async () => {
    setDetailSaving(true);
    try {
      await recruitmentAdminRepository.saveRecruitmentDetail(recruitmentGeneration, {
        // 섹션 1: 신입회원 가입 안내
        deadlineAt: detailForm.deadlineAt,
        applyGuideMd: detailForm.applyGuideMd,
        // 섹션 2: OT 안내
        otLocationMd: detailForm.otLocationMd,
        otGuideMd: detailForm.otGuideMd,
        // 섹션 3: 등록 입금 안내
        feeAmount: detailForm.feeAmount,
        feeDetailMd: detailForm.feeDetailMd,
        bankAccountText: detailForm.bankAccountText,
        feeDescriptionMd: detailForm.feeDescriptionMd,
        // 섹션 4: 정기 모임 안내
        firstMeetingAt: detailForm.firstMeetingAt,
        regularMeetingsMd: detailForm.regularMeetingsMd,
        activityScheduleMd: detailForm.activityScheduleMd,
        meetingGuideMd: detailForm.meetingGuideMd,
        // 기타
        contactEmail: detailForm.contactEmail,
        kakaoMessageTemplate: detailForm.kakaoMessageTemplate,
      });
      toast.success("모집 정보가 저장되었습니다.");
      fetchRecruitmentDetail(recruitmentGeneration);
    } catch (error) {
      console.error("Failed to save recruitment detail:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setDetailSaving(false);
    }
  };

  // OT 일정 다이얼로그 열기
  const openOtDialog = (ot?: OTSchedule) => {
    if (ot) {
      setEditingOt(ot);
      setOtForm({
        round: ot.round,
        dateAt: ot.dateAt?.toDate?.() || undefined,
        timeText: ot.timeText,
        locationText: ot.locationText,
        note: ot.note || "",
      });
    } else {
      setEditingOt(null);
      const nextRound = (recruitmentDetail?.otSchedules?.length || 0) + 1;
      setOtForm({
        round: nextRound,
        dateAt: undefined,
        timeText: "",
        locationText: "",
        note: "",
      });
    }
    setOtDialogOpen(true);
  };

  // OT 일정 저장
  const handleSaveOt = async () => {
    if (!otForm.dateAt || !otForm.timeText || !otForm.locationText) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }

    setOtSaving(true);
    try {
      if (editingOt) {
        await recruitmentAdminRepository.updateOTSchedule(recruitmentGeneration, editingOt.id, {
          round: otForm.round,
          dateAt: otForm.dateAt!,
          timeText: otForm.timeText,
          locationText: otForm.locationText,
          note: otForm.note,
        });
        toast.success("OT 일정이 수정되었습니다.");
      } else {
        await recruitmentAdminRepository.addOTSchedule(recruitmentGeneration, {
          round: otForm.round,
          dateAt: otForm.dateAt!,
          timeText: otForm.timeText,
          locationText: otForm.locationText,
          note: otForm.note,
        });
        toast.success("OT 일정이 추가되었습니다.");
      }
      setOtDialogOpen(false);
      fetchRecruitmentDetail(recruitmentGeneration);
    } catch (error) {
      console.error("Failed to save OT schedule:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setOtSaving(false);
    }
  };

  // OT 일정 삭제
  const handleDeleteOt = async () => {
    if (!deleteOtTarget) return;

    setDeletingOt(true);
    try {
      await recruitmentAdminRepository.deleteOTSchedule(recruitmentGeneration, deleteOtTarget.id);
      toast.success("OT 일정이 삭제되었습니다.");
      setDeleteOtTarget(null);
      fetchRecruitmentDetail(recruitmentGeneration);
    } catch (error) {
      console.error("Failed to delete OT schedule:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeletingOt(false);
    }
  };

  // 테이블 컬럼 정의
  const columns: Column<PreRegistration>[] = [
    {
      key: "seq",
      header: "번호",
      cell: (row) => (
        <span className="font-mono text-sm">{row.seq}</span>
      ),
      className: "w-[80px]",
    },
    {
      key: "generation",
      header: "기수",
      cell: (row) => (
        <Badge variant="outline">{row.generation}기</Badge>
      ),
      className: "w-[80px]",
    },
    {
      key: "name",
      header: "이름",
      cell: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
      className: "w-[120px]",
    },
    {
      key: "formData",
      header: "설문 내용",
      cell: (row) => (
        <div className="text-sm text-muted-foreground space-y-1">
          {Object.entries(row.formData || {}).map(([key, value]) => (
            <div key={key}>
              <span className="font-medium text-foreground">
                {fieldLabelMap[key] || key}:
              </span>{" "}
              {value}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "submittedAt",
      header: "신청일",
      cell: (row) =>
        row.submittedAt?.toDate().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      className: "w-[120px]",
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(row);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
      className: "w-[50px]",
    },
  ];

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 신규 기수 모집 섹션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                신규 기수 모집
              </CardTitle>
              <CardDescription>
                다음 기수 모집을 시작하거나 종료합니다.
              </CardDescription>
            </div>
            <Switch
              checked={isRecruitmentOpen}
              onCheckedChange={handleRecruitmentSwitch}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 현재 활동 기수 */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">현재 활동 기수</span>
            <Badge variant="secondary">{currentGeneration}기</Badge>
          </div>
          {/* 현재 모집 기수 - 모집 중일 때만 표시 */}
          {isRecruitmentOpen && (
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">현재 모집 기수</span>
              <Badge variant="default">{recruitmentGeneration}기</Badge>
            </div>
          )}
          {/* 모집 상태 */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">모집 상태</span>
            {isRecruitmentOpen ? (
              <Badge className="bg-green-500 hover:bg-green-600">모집 중</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">모집 없음</span>
            )}
          </div>
          {/* 구글폼 링크 - 모집 중일 때만 표시 */}
          {isRecruitmentOpen && recruitmentFormLink && (
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-sm text-muted-foreground">구글폼 링크</span>
              <a
                href={recruitmentFormLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate max-w-[200px]"
              >
                {recruitmentFormLink}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 모집 상세 정보 섹션 - 모집 중일 때만 표시 */}
      {isRecruitmentOpen && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {recruitmentGeneration}기 모집 정보
                </CardTitle>
                <CardDescription>
                  모집 안내에 필요한 상세 정보를 설정합니다.
                </CardDescription>
              </div>
              <Button onClick={handleSaveDetail} disabled={detailSaving || detailLoading}>
                {detailSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                저장
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="apply" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="apply">가입 안내</TabsTrigger>
                  <TabsTrigger value="ot">OT 안내</TabsTrigger>
                  <TabsTrigger value="fee">입금 안내</TabsTrigger>
                  <TabsTrigger value="meeting">정기 모임</TabsTrigger>
                </TabsList>

                {/* 섹션 1: 신입회원 가입 안내 */}
                <TabsContent value="apply" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        지원 마감일
                      </Label>
                      <DateTimePicker
                        value={detailForm.deadlineAt}
                        onChange={(date) => setDetailForm({ ...detailForm, deadlineAt: date })}
                        placeholder="마감일 및 시간 선택"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          문의 전화번호
                        </Label>
                        <Input
                          id="contactPhone"
                          value={detailForm.contactPhone}
                          onChange={(e) => setDetailForm({ ...detailForm, contactPhone: e.target.value })}
                          placeholder="010-0000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          문의 이메일
                        </Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={detailForm.contactEmail}
                          onChange={(e) => setDetailForm({ ...detailForm, contactEmail: e.target.value })}
                          placeholder="contact@growthlog.org"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>가입 안내 문구</Label>
                    <MarkdownEditor
                      value={detailForm.applyGuideMd}
                      onChange={(value) => setDetailForm({ ...detailForm, applyGuideMd: value })}
                      placeholder="가입 안내 문구를 작성하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>카카오톡 문자 양식</Label>
                    <Textarea
                      value={detailForm.kakaoMessageTemplate}
                      onChange={(e) => setDetailForm({ ...detailForm, kakaoMessageTemplate: e.target.value })}
                      placeholder="카카오톡으로 보낼 문자 양식을 입력하세요"
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      홈페이지에서 사용자가 이 양식을 복사할 수 있습니다.
                    </p>
                  </div>
                </TabsContent>

                {/* 섹션 2: OT 안내 */}
                <TabsContent value="ot" className="space-y-4 mt-4">
                  {/* OT 일정 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        OT 일정
                      </Label>
                      <Button variant="outline" size="sm" onClick={() => openOtDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        OT 추가
                      </Button>
                    </div>
                    {recruitmentDetail?.otSchedules && recruitmentDetail.otSchedules.length > 0 ? (
                      <div className="space-y-2">
                        {recruitmentDetail.otSchedules.map((ot) => (
                          <div
                            key={ot.id}
                            className="flex items-center gap-3 p-3 bg-gray-6 rounded-lg"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {ot.round}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">
                                {ot.dateAt?.toDate?.()
                                  ? ot.dateAt.toDate().toLocaleDateString("ko-KR", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      weekday: "short",
                                    })
                                  : "날짜 미정"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {ot.timeText} · {ot.locationText}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button variant="ghost" size="icon" onClick={() => openOtDialog(ot)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteOtTarget(ot)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                        등록된 OT 일정이 없습니다.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>OT 장소 안내</Label>
                    <Textarea
                      value={detailForm.otLocationMd}
                      onChange={(e) => setDetailForm({ ...detailForm, otLocationMd: e.target.value })}
                      placeholder="OT 장소에 대한 상세 안내를 작성하세요"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OT 안내 문구</Label>
                    <Textarea
                      value={detailForm.otGuideMd}
                      onChange={(e) => setDetailForm({ ...detailForm, otGuideMd: e.target.value })}
                      placeholder="OT 참석 및 가입 관련 안내를 작성하세요"
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* 섹션 3: 등록 입금 안내 */}
                <TabsContent value="fee" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="feeAmount" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        총 납부 금액
                      </Label>
                      <div className="relative">
                        <Input
                          id="feeAmount"
                          type="number"
                          value={detailForm.feeAmount || ""}
                          onChange={(e) => setDetailForm({ ...detailForm, feeAmount: parseInt(e.target.value) || 0 })}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          원
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountText">납부 계좌</Label>
                      <Input
                        id="bankAccountText"
                        value={detailForm.bankAccountText}
                        onChange={(e) => setDetailForm({ ...detailForm, bankAccountText: e.target.value })}
                        placeholder="예: KB국민은행 421701-04-311519 그로스로그"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>회비 상세 내역</Label>
                    <Textarea
                      value={detailForm.feeDetailMd}
                      onChange={(e) => setDetailForm({ ...detailForm, feeDetailMd: e.target.value })}
                      placeholder="회비, 보증금, 가입비 등 상세 내역을 작성하세요"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      예: • 회비: 21만원 - 공간대여비, 라운지 운영비, 간식비 등
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>회비 안내 문구</Label>
                    <Textarea
                      value={detailForm.feeDescriptionMd}
                      onChange={(e) => setDetailForm({ ...detailForm, feeDescriptionMd: e.target.value })}
                      placeholder="회비 사용 내역 투명 공개, 보증금 환불 안내 등을 작성하세요"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* 섹션 4: 정기 모임 안내 */}
                <TabsContent value="meeting" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        첫 정기 모임 일시
                      </Label>
                      <DateTimePicker
                        value={detailForm.firstMeetingAt}
                        onChange={(date) => setDetailForm({ ...detailForm, firstMeetingAt: date })}
                        placeholder="첫 모임 일시 선택"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      정기 모임 일정
                    </Label>
                    <Textarea
                      value={detailForm.regularMeetingsMd}
                      onChange={(e) => setDetailForm({ ...detailForm, regularMeetingsMd: e.target.value })}
                      placeholder="정기 모임 일정을 안내하세요 (예: 매월 첫 번째 토요일 15:00)"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>월별 활동 일정</Label>
                    <Textarea
                      value={detailForm.activityScheduleMd}
                      onChange={(e) => setDetailForm({ ...detailForm, activityScheduleMd: e.target.value })}
                      placeholder="월별 활동 계획을 작성하세요"
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      예: • 3월: 신입회원 온보딩 + 정기모임
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>정기 모임 안내 문구</Label>
                    <Textarea
                      value={detailForm.meetingGuideMd}
                      onChange={(e) => setDetailForm({ ...detailForm, meetingGuideMd: e.target.value })}
                      placeholder="정기 모임에 대한 추가 안내를 작성하세요"
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* 사전등록 신청 관리 섹션 */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            사전등록 신청 관리
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            사전등록 신청 폼과 신청자 목록을 관리합니다.
          </p>
        </div>

        {/* 사전등록 신청 폼 관리 카드 */}
        <Link href="/admin/recruitment/form">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">사전등록 신청 폼 관리</CardTitle>
                    <CardDescription>
                      사전등록 신청 시 수집할 정보를 설정합니다.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{formFields.length}개 필드</Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* 사전등록 신청자 목록 */}
        <div className="space-y-4 mt-4">
          {/* 헤더 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              총 {filteredRegistrations.length}명의 사전등록 신청자
            </p>
            <div className="flex items-center gap-2">
              {/* 기수 필터 */}
              <Select
                value={filterGeneration}
                onValueChange={setFilterGeneration}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="기수 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기수</SelectItem>
                  {availableGenerations.map((gen) => (
                    <SelectItem key={gen} value={String(gen)}>
                      {gen}기
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 정렬 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    정렬
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => toggleSort("submittedAt")}>
                    최신순 {sortField === "submittedAt" && (sortOrder === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("name")}>
                    이름순 {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 검색 */}
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="이름 또는 번호 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <DataTable
            columns={columns}
            data={filteredRegistrations}
            loading={loading}
            emptyMessage="사전등록 신청자가 없습니다."
          />
        </div>
      </div>

      {/* 모집 시작 다이얼로그 */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새로운 기수 모집 시작</DialogTitle>
            <DialogDescription>
              모집할 기수를 설정하고 구글폼 링크를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="generation">모집 기수</Label>
              <div className="relative w-32">
                <Input
                  id="generation"
                  type="number"
                  min={1}
                  value={dialogGeneration || ""}
                  onChange={(e) => setDialogGeneration(parseInt(e.target.value) || 0)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  기
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formLink">구글폼 링크</Label>
              <Input
                id="formLink"
                value={dialogFormLink}
                onChange={(e) => setDialogFormLink(e.target.value)}
                placeholder="https://forms.google.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(false)}
              disabled={dialogLoading}
            >
              취소
            </Button>
            <Button onClick={handleOpenRecruitmentClick} disabled={dialogLoading}>
              {dialogLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogGeneration || nextGeneration}기 모집 시작
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 기수 확인 다이얼로그 */}
      <ConfirmDialog
        open={generationConfirmOpen}
        onOpenChange={setGenerationConfirmOpen}
        title="모집 기수 확인"
        description={`현재 기수(${currentGeneration}기)의 다음 기수는 ${nextGeneration}기입니다. ${dialogGeneration}기를 모집하시겠습니까?`}
        confirmText="모집 시작"
        loading={dialogLoading}
        onConfirm={handleOpenRecruitment}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="사전등록 신청 삭제"
        description={`${deleteTarget?.name}님의 사전등록 신청을 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />

      {/* 모집 종료 확인 다이얼로그 */}
      <ConfirmDialog
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        title="모집 종료"
        description={`${recruitmentGeneration}기 모집을 종료하시겠습니까?`}
        confirmText="종료"
        variant="destructive"
        loading={closing}
        onConfirm={handleCloseRecruitment}
      />

      {/* OT 일정 다이얼로그 */}
      <Dialog open={otDialogOpen} onOpenChange={setOtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOt ? "OT 일정 수정" : "OT 일정 추가"}
            </DialogTitle>
            <DialogDescription>
              OT 일정 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="otRound">회차</Label>
                <Input
                  id="otRound"
                  type="number"
                  min={1}
                  value={otForm.round}
                  onChange={(e) => setOtForm({ ...otForm, round: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>날짜 *</Label>
                <DatePicker
                  value={otForm.dateAt}
                  onChange={(date) => setOtForm({ ...otForm, dateAt: date })}
                  placeholder="날짜 선택"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otTime">시간 *</Label>
              <Input
                id="otTime"
                value={otForm.timeText}
                onChange={(e) => setOtForm({ ...otForm, timeText: e.target.value })}
                placeholder="예: 오후 2시 ~ 4시"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otLocation">장소 *</Label>
              <Input
                id="otLocation"
                value={otForm.locationText}
                onChange={(e) => setOtForm({ ...otForm, locationText: e.target.value })}
                placeholder="예: 그로스로그 오프라인 공간"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otNote">비고</Label>
              <Input
                id="otNote"
                value={otForm.note}
                onChange={(e) => setOtForm({ ...otForm, note: e.target.value })}
                placeholder="추가 안내 사항"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOtDialogOpen(false)} disabled={otSaving}>
              취소
            </Button>
            <Button onClick={handleSaveOt} disabled={otSaving}>
              {otSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingOt ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OT 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteOtTarget}
        onOpenChange={(open) => !open && setDeleteOtTarget(null)}
        title="OT 일정 삭제"
        description={`${deleteOtTarget?.round}회차 OT 일정을 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="destructive"
        loading={deletingOt}
        onConfirm={handleDeleteOt}
      />
    </div>
  );
}
