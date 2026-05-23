"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Trophy,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import { ConfirmDialog } from "@/presentation/components/admin";
import { awardAdminRepository } from "@/infrastructure/repositories/admin/awardAdminRepository";
import { activityAdminRepository } from "@/infrastructure/repositories/admin/activityAdminRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import type { Award, ProjectActivity } from "@/domain/entities";

/**
 * 수상 내역 관리 페이지
 */
export default function AdminAwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [projects, setProjects] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentGeneration, setCurrentGeneration] = useState(0);

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<Award | null>(null);

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<Award | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const [awardsData, activitiesData, siteConfig] = await Promise.all([
        awardAdminRepository.getAllAwards(),
        activityAdminRepository.getActivitiesByCategory("project"),
        siteConfigRepository.getSiteConfig(),
      ]);
      setAwards(awardsData);
      setProjects(activitiesData as ProjectActivity[]);
      if (siteConfig) {
        setCurrentGeneration(siteConfig.currentGeneration || 0);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 프로젝트 ID로 프로젝트 찾기
  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await awardAdminRepository.deleteAward(deleteTarget.id);
      toast.success("수상 내역이 삭제되었습니다.");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 활성화 토글
  const handleToggleActive = async (award: Award) => {
    try {
      await awardAdminRepository.toggleActive(award.id, !award.isActive);
      toast.success(award.isActive ? "비공개로 변경되었습니다." : "공개로 변경되었습니다.");
      fetchData();
    } catch (error) {
      console.error("Failed to toggle active:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          총 {awards.length}개의 수상 내역
        </p>
        <Button onClick={() => {
          setEditingAward(null);
          setDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          수상 내역 추가
        </Button>
      </div>

      {/* 목록 */}
      {awards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">등록된 수상 내역이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {awards.map((award) => (
            <AwardCard
              key={award.id}
              award={award}
              linkedProject={award.projectId ? getProjectById(award.projectId) : undefined}
              onEdit={() => {
                setEditingAward(award);
                setDialogOpen(true);
              }}
              onDelete={() => setDeleteTarget(award)}
              onToggleActive={() => handleToggleActive(award)}
            />
          ))}
        </div>
      )}

      {/* 추가/수정 다이얼로그 */}
      <AwardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingAward={editingAward}
        projects={projects}
        currentGeneration={currentGeneration}
        onSaved={() => {
          setDialogOpen(false);
          fetchData();
        }}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="수상 내역 삭제"
        description={`"${deleteTarget?.projectName || ""}"의 수상 내역을 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/**
 * 수상 내역 카드 컴포넌트
 */
function AwardCard({
  award,
  linkedProject,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  award: Award;
  linkedProject?: ProjectActivity;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <Card className={!award.isActive ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 트로피 아이콘 */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0">
                {award.awardTitle}
              </Badge>
              <Badge variant="outline">{award.generation}기</Badge>
              {linkedProject && (
                <Badge variant="secondary" className="text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  프로젝트 연결됨
                </Badge>
              )}
              {!award.isActive && (
                <Badge variant="secondary" className="bg-gray-4">비공개</Badge>
              )}
            </div>
            <h3 className="font-medium truncate">{award.projectName}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {award.competitionName} · {formatDate(award.awardDate)}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleActive}
              title={award.isActive ? "비공개로 변경" : "공개로 변경"}
            >
              {award.isActive ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 수상 내역 폼 다이얼로그
 */
function AwardFormDialog({
  open,
  onOpenChange,
  editingAward,
  projects,
  currentGeneration,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAward: Award | null;
  projects: ProjectActivity[];
  currentGeneration: number;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number | boolean | Date | undefined>>({});

  // 폼 초기화
  useEffect(() => {
    if (open) {
      if (editingAward) {
        // 수정 모드
        setFormData({
          projectId: editingAward.projectId || "",
          awardTitle: editingAward.awardTitle,
          competitionName: editingAward.competitionName,
          projectName: editingAward.projectName,
          awardDate: editingAward.awardDate?.toDate?.() || undefined,
          generation: editingAward.generation,
          order: editingAward.order,
          isActive: editingAward.isActive,
        });
      } else {
        // 추가 모드
        setFormData({
          projectId: "",
          awardTitle: "",
          competitionName: "",
          projectName: "",
          awardDate: new Date(),
          generation: currentGeneration,
          order: 0,
          isActive: true,
        });
      }
    }
  }, [open, editingAward, currentGeneration]);

  const updateField = (key: string, value: string | number | boolean | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // "연결 안 함" 선택을 위한 특별 값 (빈 문자열은 Radix Select에서 허용되지 않음)
  const NO_PROJECT_VALUE = "__none__";

  // 프로젝트 선택 시 자동 채우기
  const handleProjectSelect = (value: string) => {
    const projectId = value === NO_PROJECT_VALUE ? "" : value;
    updateField("projectId", projectId);

    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        updateField("projectName", project.projectName);
        updateField("generation", project.generation);
      }
    }
  };

  const handleSave = async () => {
    // 필수값 검증
    if (!formData.awardTitle || !formData.competitionName || !formData.projectName) {
      toast.error("수상명, 대회명, 프로젝트명은 필수입니다.");
      return;
    }

    setSaving(true);
    try {
      const data = {
        projectId: String(formData.projectId || ""),
        awardTitle: String(formData.awardTitle),
        competitionName: String(formData.competitionName),
        projectName: String(formData.projectName),
        awardDate: formData.awardDate as Date,
        generation: Number(formData.generation) || currentGeneration,
        order: Number(formData.order) || 0,
        isActive: formData.isActive !== false,
      };

      if (editingAward) {
        await awardAdminRepository.updateAward(editingAward.id, data);
        toast.success("수정되었습니다.");
      } else {
        await awardAdminRepository.addAward(data);
        toast.success("추가되었습니다.");
      }

      onSaved();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAward ? "수상 내역 수정" : "수상 내역 추가"}
          </DialogTitle>
          <DialogDescription>
            수상 정보를 입력하세요. 프로젝트를 연결하면 해당 프로젝트 카드에 왕관이 표시됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 프로젝트 연결 */}
          <div className="space-y-2">
            <Label>프로젝트 연결</Label>
            <Select
              value={formData.projectId ? String(formData.projectId) : NO_PROJECT_VALUE}
              onValueChange={handleProjectSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="프로젝트 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT_VALUE}>연결 안 함</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectName} ({project.generation}기)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              프로젝트를 선택하면 해당 프로젝트 카드에 왕관 아이콘이 표시됩니다.
            </p>
          </div>

          {/* 수상명 */}
          <div className="space-y-2">
            <Label htmlFor="awardTitle">수상명 *</Label>
            <Input
              id="awardTitle"
              value={String(formData.awardTitle || "")}
              onChange={(e) => updateField("awardTitle", e.target.value)}
              placeholder="예: 대상, 최우수상, 우수상, 장려상"
            />
          </div>

          {/* 대회명 */}
          <div className="space-y-2">
            <Label htmlFor="competitionName">대회명 *</Label>
            <Input
              id="competitionName"
              value={String(formData.competitionName || "")}
              onChange={(e) => updateField("competitionName", e.target.value)}
              placeholder="예: 2024 SW 경진대회"
            />
          </div>

          {/* 프로젝트명 */}
          <div className="space-y-2">
            <Label htmlFor="projectName">프로젝트명 *</Label>
            <Input
              id="projectName"
              value={String(formData.projectName || "")}
              onChange={(e) => updateField("projectName", e.target.value)}
              placeholder="수상 프로젝트 이름"
            />
            {formData.projectId && (
              <p className="text-xs text-muted-foreground">
                연결된 프로젝트에서 자동으로 채워집니다.
              </p>
            )}
          </div>

          {/* 수상일 */}
          <div className="space-y-2">
            <Label>수상일</Label>
            <DatePicker
              value={formData.awardDate as Date | undefined}
              onChange={(date) => updateField("awardDate", date)}
              placeholder="날짜 선택"
            />
          </div>

          {/* 기수 */}
          <div className="space-y-2">
            <Label htmlFor="generation">활동 기수</Label>
            <div className="relative w-24">
              <Input
                id="generation"
                type="number"
                min={1}
                value={Number(formData.generation) || ""}
                onChange={(e) => updateField("generation", parseInt(e.target.value) || 0)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">기</span>
            </div>
          </div>

          {/* 정렬 순서 */}
          <div className="space-y-2">
            <Label htmlFor="order">정렬 순서</Label>
            <Input
              id="order"
              type="number"
              min={0}
              value={Number(formData.order) || 0}
              onChange={(e) => updateField("order", parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              숫자가 작을수록 먼저 표시됩니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingAward ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
