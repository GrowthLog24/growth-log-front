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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { DataTable, Column, ConfirmDialog } from "@/presentation/components/admin";
import { recruitmentAdminRepository } from "@/infrastructure/repositories/admin/recruitmentAdminRepository";
import type { PreRegistration, PreRegistrationField } from "@/domain/entities";

type SortField = "submittedAt" | "name";
type SortOrder = "asc" | "desc";

/**
 * 모집/사전 신청 통합 관리 페이지
 */
export default function RecruitmentPage() {
  // 모집 설정 상태
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false);
  const [recruitmentGeneration, setRecruitmentGeneration] = useState(0);
  const [recruitmentFormLink, setRecruitmentFormLink] = useState("");

  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogGeneration, setDialogGeneration] = useState("");
  const [dialogFormLink, setDialogFormLink] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);

  // 사전 신청 목록 상태
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

  // 모집 설정 로드
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await recruitmentAdminRepository.getRecruitmentSettings();
        if (settings) {
          setIsRecruitmentOpen(settings.isOpen);
          setRecruitmentGeneration(settings.generation);
          setRecruitmentFormLink(settings.formLink);
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

  // 필드 ID -> 라벨 매핑
  const fieldLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    formFields.forEach((field) => {
      map[field.id] = field.label;
    });
    return map;
  }, [formFields]);

  // 사전 신청 목록 로드
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
      toast.error("사전 신청 목록을 불러오는데 실패했습니다.");
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

  // 모집 스위치 핸들러
  const handleRecruitmentSwitch = (checked: boolean) => {
    if (checked) {
      // ON으로 변경 시 다이얼로그 열기
      setDialogGeneration(String(recruitmentGeneration + 1));
      setDialogFormLink("");
      setOpenDialog(true);
    } else {
      // OFF로 변경 시 확인 다이얼로그 열기
      setCloseConfirmOpen(true);
    }
  };

  // 모집 시작
  const handleOpenRecruitment = async () => {
    if (!dialogGeneration || !dialogFormLink.trim()) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    setDialogLoading(true);
    try {
      await recruitmentAdminRepository.openRecruitment(
        parseInt(dialogGeneration),
        dialogFormLink.trim()
      );
      setIsRecruitmentOpen(true);
      setRecruitmentGeneration(parseInt(dialogGeneration));
      setRecruitmentFormLink(dialogFormLink.trim());
      setOpenDialog(false);
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
      toast.success("사전 신청이 삭제되었습니다.");
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
                {recruitmentGeneration > 0 ? (
                  <>
                    현재 기수: <span className="font-semibold text-foreground">{recruitmentGeneration}기</span>
                    {" · "}
                  </>
                ) : null}
                새로운 기수 모집을 시작하거나 종료합니다.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {isRecruitmentOpen && (
                <Badge variant="default" className="text-sm">
                  {recruitmentGeneration}기 모집 중
                </Badge>
              )}
              <Switch
                checked={isRecruitmentOpen}
                onCheckedChange={handleRecruitmentSwitch}
              />
            </div>
          </div>
        </CardHeader>
        {isRecruitmentOpen && recruitmentFormLink && (
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">구글폼 링크:</span>{" "}
              <a
                href={recruitmentFormLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {recruitmentFormLink}
              </a>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 사전 신청 관리 섹션 */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            사전 신청 관리
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            사전 신청 폼과 신청자 목록을 관리합니다.
          </p>
        </div>

        {/* 사전 신청 폼 관리 카드 */}
        <Link href="/admin/recruitment/form">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">사전 신청 폼 관리</CardTitle>
                    <CardDescription>
                      사전 신청 시 수집할 정보를 설정합니다.
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

        {/* 사전 신청자 목록 */}
        <div className="space-y-4 mt-4">
          {/* 헤더 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              총 {filteredRegistrations.length}명의 사전 신청자
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
            emptyMessage="사전 신청자가 없습니다."
          />
        </div>
      </div>

      {/* 모집 시작 다이얼로그 */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새로운 기수 모집 시작</DialogTitle>
            <DialogDescription>
              모집을 시작하려면 아래 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="generation">모집 기수</Label>
              <Input
                id="generation"
                type="number"
                min={1}
                value={dialogGeneration}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDialogGeneration(e.target.value)}
                placeholder="예: 5"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
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
            <Button onClick={handleOpenRecruitment} disabled={dialogLoading}>
              {dialogLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              모집 시작
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="사전 신청 삭제"
        description={`${deleteTarget?.name}님의 사전 신청을 삭제하시겠습니까?`}
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
    </div>
  );
}
