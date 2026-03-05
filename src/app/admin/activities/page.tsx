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
  ExternalLink,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ConfirmDialog } from "@/presentation/components/admin";
import { activityAdminRepository } from "@/infrastructure/repositories/admin/activityAdminRepository";
import { uploadFile, generateStoragePath } from "@/infrastructure/firebase/storage";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import {
  ACTIVITY_CATEGORY_LABELS,
  type Activity,
  type ActivityCategory,
  type ProjectActivity,
  type StudyActivity,
  type GrowthLogActivity,
  type LectureActivity,
  type GrowthTalkActivity,
  type ClubActivity,
} from "@/domain/entities";

const CATEGORIES: ActivityCategory[] = [
  "project",
  "study",
  "growth-log",
  "lecture",
  "growth-talk",
  "club",
];

/**
 * 활동 기록 페이지
 */
export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [activeTab, setActiveTab] = useState<ActivityCategory>("project");

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const [activitiesData, siteConfig] = await Promise.all([
        activityAdminRepository.getAllActivities(),
        siteConfigRepository.getSiteConfig(),
      ]);
      setActivities(activitiesData);
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

  // 카테고리별 필터링
  const filteredActivities = activities.filter(
    (a) => a.category === activeTab
  );

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await activityAdminRepository.deleteActivity(deleteTarget.id);
      toast.success("활동이 삭제되었습니다.");
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
  const handleToggleActive = async (activity: Activity) => {
    try {
      await activityAdminRepository.toggleActive(activity.id, !activity.isActive);
      toast.success(activity.isActive ? "비공개로 변경되었습니다." : "공개로 변경되었습니다.");
      fetchData();
    } catch (error) {
      console.error("Failed to toggle active:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  // 활동 제목 가져오기 (카테고리별로 다름)
  const getActivityTitle = (activity: Activity): string => {
    switch (activity.category) {
      case "project":
        return (activity as ProjectActivity).projectName;
      case "study":
        return (activity as StudyActivity).subjectName;
      case "growth-log":
        return (activity as GrowthLogActivity).title;
      case "lecture":
        return (activity as LectureActivity).lectureName;
      case "growth-talk":
        return (activity as GrowthTalkActivity).title;
      case "club":
        return (activity as ClubActivity).clubName;
      default:
        return "";
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActivityCategory)}>
        <TabsList className="grid grid-cols-6 w-full">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
              {ACTIVITY_CATEGORY_LABELS[cat]}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat} value={cat} className="space-y-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                총 {filteredActivities.length}개의 {ACTIVITY_CATEGORY_LABELS[cat]}
              </p>
              <Button onClick={() => {
                setEditingActivity(null);
                setDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {ACTIVITY_CATEGORY_LABELS[cat]} 추가
              </Button>
            </div>

            {/* 목록 */}
            {filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">등록된 {ACTIVITY_CATEGORY_LABELS[cat]}이(가) 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onEdit={() => {
                      setEditingActivity(activity);
                      setDialogOpen(true);
                    }}
                    onDelete={() => setDeleteTarget(activity)}
                    onToggleActive={() => handleToggleActive(activity)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 추가/수정 다이얼로그 */}
      <ActivityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={activeTab}
        editingActivity={editingActivity}
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
        title="활동 삭제"
        description={`"${deleteTarget ? getActivityTitle(deleteTarget) : ""}"을(를) 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/**
 * 활동 카드 컴포넌트
 */
function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const getTitle = () => {
    switch (activity.category) {
      case "project":
        return (activity as ProjectActivity).projectName;
      case "study":
        return (activity as StudyActivity).subjectName;
      case "growth-log":
        return (activity as GrowthLogActivity).title;
      case "lecture":
        return (activity as LectureActivity).lectureName;
      case "growth-talk":
        return (activity as GrowthTalkActivity).title;
      case "club":
        return (activity as ClubActivity).clubName;
    }
  };

  const getSubtitle = () => {
    switch (activity.category) {
      case "project": {
        const p = activity as ProjectActivity;
        return `${p.platform} · ${p.leaderName}`;
      }
      case "study": {
        const s = activity as StudyActivity;
        return `${s.semester} · ${s.leaderName}`;
      }
      case "growth-log": {
        const g = activity as GrowthLogActivity;
        return `${g.field} · ${g.authorName}`;
      }
      case "lecture": {
        const l = activity as LectureActivity;
        return `${l.speakerOrganization} · ${l.speakerTitle}`;
      }
      case "growth-talk": {
        const t = activity as GrowthTalkActivity;
        return `${t.field} · ${t.hostName}`;
      }
      case "club": {
        const c = activity as ClubActivity;
        return c.leaderName;
      }
    }
  };

  const isClickable = activity.category === "project" || activity.category === "growth-log";

  return (
    <Card className={!activity.isActive ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 썸네일 */}
          <div className="w-20 h-14 bg-gray-5 rounded-lg overflow-hidden flex-shrink-0">
            {activity.thumbnailUrl ? (
              <img
                src={activity.thumbnailUrl}
                alt={getTitle()}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{activity.generation}기</Badge>
              {!activity.isActive && (
                <Badge variant="secondary" className="bg-gray-4">비공개</Badge>
              )}
              {isClickable && (
                <Badge variant="secondary" className="text-xs">
                  {activity.category === "project" ? "PDF" : "링크"}
                </Badge>
              )}
            </div>
            <h3 className="font-medium truncate">{getTitle()}</h3>
            <p className="text-sm text-muted-foreground truncate">{getSubtitle()}</p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleActive}
              title={activity.isActive ? "비공개로 변경" : "공개로 변경"}
            >
              {activity.isActive ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            {activity.category === "project" && (activity as ProjectActivity).pdfUrl && (
              <Button variant="ghost" size="icon" asChild>
                <a href={(activity as ProjectActivity).pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4" />
                </a>
              </Button>
            )}
            {activity.category === "growth-log" && (activity as GrowthLogActivity).blogUrl && (
              <Button variant="ghost" size="icon" asChild>
                <a href={(activity as GrowthLogActivity).blogUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
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
 * 활동 폼 다이얼로그
 */
function ActivityFormDialog({
  open,
  onOpenChange,
  category,
  editingActivity,
  currentGeneration,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ActivityCategory;
  editingActivity: Activity | null;
  currentGeneration: number;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number | boolean | Date | undefined>>({});
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");

  // 폼 초기화
  useEffect(() => {
    if (open) {
      // 파일 상태 초기화
      setThumbnailFile(null);
      setPdfFile(null);
      setPdfFileName("");

      if (editingActivity) {
        // 수정 모드: 기존 데이터로 초기화
        const data: Record<string, string | number | boolean> = {
          thumbnailUrl: editingActivity.thumbnailUrl || "",
          generation: editingActivity.generation,
          isActive: editingActivity.isActive,
        };

        // 기존 썸네일이 있으면 미리보기 설정
        setThumbnailPreview(editingActivity.thumbnailUrl || "");

        switch (editingActivity.category) {
          case "project": {
            const p = editingActivity as ProjectActivity;
            Object.assign(data, {
              projectName: p.projectName,
              platform: p.platform,
              leaderName: p.leaderName,
              description: p.description,
              pdfUrl: p.pdfUrl,
            });
            // 기존 PDF가 있으면 파일명 추출해서 표시
            if (p.pdfUrl) {
              try {
                const url = new URL(p.pdfUrl);
                const pathParts = decodeURIComponent(url.pathname).split("/");
                const fileName = pathParts[pathParts.length - 1].split("?")[0];
                setPdfFileName(fileName || "발표자료.pdf");
              } catch {
                setPdfFileName("발표자료.pdf");
              }
            }
            break;
          }
          case "study": {
            const s = editingActivity as StudyActivity;
            Object.assign(data, {
              subjectName: s.subjectName,
              semester: s.semester,
              leaderName: s.leaderName,
            });
            break;
          }
          case "growth-log": {
            const g = editingActivity as GrowthLogActivity;
            Object.assign(data, {
              title: g.title,
              field: g.field,
              authorName: g.authorName,
              excerpt: g.excerpt,
              blogUrl: g.blogUrl,
            });
            break;
          }
          case "lecture": {
            const l = editingActivity as LectureActivity;
            Object.assign(data, {
              lectureName: l.lectureName,
              speakerOrganization: l.speakerOrganization,
              speakerTitle: l.speakerTitle,
              lectureDate: l.lectureDate?.toDate?.() || undefined,
            });
            break;
          }
          case "growth-talk": {
            const t = editingActivity as GrowthTalkActivity;
            Object.assign(data, {
              title: t.title,
              field: t.field,
              hostName: t.hostName,
              eventDate: t.eventDate?.toDate?.() || undefined,
            });
            break;
          }
          case "club": {
            const c = editingActivity as ClubActivity;
            Object.assign(data, {
              clubName: c.clubName,
              leaderName: c.leaderName,
              description: c.description,
            });
            break;
          }
        }

        setFormData(data);
      } else {
        // 추가 모드: 기본값으로 초기화
        setThumbnailPreview("");
        setFormData({
          thumbnailUrl: "",
          generation: currentGeneration,
          isActive: true,
        });
      }
    }
  }, [open, editingActivity, currentGeneration]);

  // 썸네일 파일 선택 핸들러
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // PDF 파일 선택 핸들러
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setPdfFileName(file.name);
    }
  };

  const updateField = (key: string, value: string | number | boolean | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 썸네일 이미지 업로드
      let thumbnailUrl = String(formData.thumbnailUrl || "");
      if (thumbnailFile) {
        const path = generateStoragePath(`activities/${category}/thumbnails`, thumbnailFile.name);
        thumbnailUrl = await uploadFile(thumbnailFile, path);
      }

      // PDF 파일 업로드 (프로젝트만)
      let pdfUrl = String(formData.pdfUrl || "");
      if (category === "project" && pdfFile) {
        const path = generateStoragePath("activities/project/pdfs", pdfFile.name);
        pdfUrl = await uploadFile(pdfFile, path);
      }

      const baseData = {
        thumbnailUrl,
        generation: Number(formData.generation) || currentGeneration,
        order: 0,
        isActive: formData.isActive !== false,
      };

      if (editingActivity) {
        // 수정
        switch (category) {
          case "project":
            await activityAdminRepository.updateProject(editingActivity.id, {
              ...baseData,
              projectName: String(formData.projectName || ""),
              platform: String(formData.platform || ""),
              leaderName: String(formData.leaderName || ""),
              description: String(formData.description || ""),
              pdfUrl: pdfUrl || String(formData.pdfUrl || ""),
            });
            break;
          case "study":
            await activityAdminRepository.updateStudy(editingActivity.id, {
              ...baseData,
              subjectName: String(formData.subjectName || ""),
              semester: String(formData.semester || ""),
              leaderName: String(formData.leaderName || ""),
            });
            break;
          case "growth-log":
            await activityAdminRepository.updateGrowthLog(editingActivity.id, {
              ...baseData,
              title: String(formData.title || ""),
              field: String(formData.field || ""),
              authorName: String(formData.authorName || ""),
              excerpt: String(formData.excerpt || ""),
              blogUrl: String(formData.blogUrl || ""),
            });
            break;
          case "lecture":
            await activityAdminRepository.updateLecture(editingActivity.id, {
              ...baseData,
              lectureName: String(formData.lectureName || ""),
              speakerOrganization: String(formData.speakerOrganization || ""),
              speakerTitle: String(formData.speakerTitle || ""),
              lectureDate: formData.lectureDate as Date | undefined,
            });
            break;
          case "growth-talk":
            await activityAdminRepository.updateGrowthTalk(editingActivity.id, {
              ...baseData,
              title: String(formData.title || ""),
              field: String(formData.field || ""),
              hostName: String(formData.hostName || ""),
              eventDate: formData.eventDate as Date | undefined,
            });
            break;
          case "club":
            await activityAdminRepository.updateClub(editingActivity.id, {
              ...baseData,
              clubName: String(formData.clubName || ""),
              leaderName: String(formData.leaderName || ""),
              description: String(formData.description || ""),
            });
            break;
        }
        toast.success("수정되었습니다.");
      } else {
        // 추가
        switch (category) {
          case "project":
            await activityAdminRepository.addProject({
              ...baseData,
              projectName: String(formData.projectName || ""),
              platform: String(formData.platform || ""),
              leaderName: String(formData.leaderName || ""),
              description: String(formData.description || ""),
              pdfUrl: pdfUrl,
            });
            break;
          case "study":
            await activityAdminRepository.addStudy({
              ...baseData,
              subjectName: String(formData.subjectName || ""),
              semester: String(formData.semester || ""),
              leaderName: String(formData.leaderName || ""),
            });
            break;
          case "growth-log":
            await activityAdminRepository.addGrowthLog({
              ...baseData,
              title: String(formData.title || ""),
              field: String(formData.field || ""),
              authorName: String(formData.authorName || ""),
              excerpt: String(formData.excerpt || ""),
              blogUrl: String(formData.blogUrl || ""),
            });
            break;
          case "lecture":
            await activityAdminRepository.addLecture({
              ...baseData,
              lectureName: String(formData.lectureName || ""),
              speakerOrganization: String(formData.speakerOrganization || ""),
              speakerTitle: String(formData.speakerTitle || ""),
              lectureDate: (formData.lectureDate as Date | undefined) ?? new Date(),
            });
            break;
          case "growth-talk":
            await activityAdminRepository.addGrowthTalk({
              ...baseData,
              title: String(formData.title || ""),
              field: String(formData.field || ""),
              hostName: String(formData.hostName || ""),
              eventDate: (formData.eventDate as Date | undefined) ?? new Date(),
            });
            break;
          case "club":
            await activityAdminRepository.addClub({
              ...baseData,
              clubName: String(formData.clubName || ""),
              leaderName: String(formData.leaderName || ""),
              description: String(formData.description || ""),
            });
            break;
        }
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
            {editingActivity ? `${ACTIVITY_CATEGORY_LABELS[category]} 수정` : `${ACTIVITY_CATEGORY_LABELS[category]} 추가`}
          </DialogTitle>
          <DialogDescription>
            {ACTIVITY_CATEGORY_LABELS[category]} 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 공통: 썸네일 */}
          <div className="space-y-2">
            <Label>대표 이미지</Label>
            <div className="space-y-3">
              {/* 미리보기 */}
              {thumbnailPreview && (
                <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-gray-5">
                  <img
                    src={thumbnailPreview}
                    alt="미리보기"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview("");
                      updateField("thumbnailUrl", "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {/* 파일 선택 */}
              {!thumbnailPreview && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      클릭하여 이미지 선택
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WebP (권장: 800x500)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 공통: 기수 */}
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

          {/* 카테고리별 필드 */}
          {category === "project" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="projectName">프로젝트 이름 *</Label>
                <Input
                  id="projectName"
                  value={String(formData.projectName || "")}
                  onChange={(e) => updateField("projectName", e.target.value)}
                  placeholder="예: 그로스로그 웹사이트 리뉴얼"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">개발 플랫폼</Label>
                <Input
                  id="platform"
                  value={String(formData.platform || "")}
                  onChange={(e) => updateField("platform", e.target.value)}
                  placeholder="예: Web, iOS, Android, Embedded"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaderName">PM (프로젝트 매니저)</Label>
                <Input
                  id="leaderName"
                  value={String(formData.leaderName || "")}
                  onChange={(e) => updateField("leaderName", e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">한 줄 소개</Label>
                <Textarea
                  id="description"
                  value={String(formData.description || "")}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="프로젝트를 한 문장으로 소개해주세요"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>발표자료 (PDF)</Label>
                <div className="space-y-2">
                  {/* 기존 파일 또는 새로 선택한 파일 표시 */}
                  {(pdfFileName || formData.pdfUrl) && (
                    <div className="flex items-center gap-2 p-3 bg-gray-6 rounded-lg">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm truncate flex-1">
                        {pdfFileName || "기존 발표자료"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => {
                          setPdfFile(null);
                          setPdfFileName("");
                          updateField("pdfUrl", "");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {/* 파일 선택 */}
                  {!pdfFileName && !formData.pdfUrl && (
                    <label className="flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        PDF 파일 선택
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={handlePdfChange}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">클릭 시 이 파일이 열립니다.</p>
              </div>
            </>
          )}

          {category === "study" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="subjectName">스터디 과목 *</Label>
                <Input
                  id="subjectName"
                  value={String(formData.subjectName || "")}
                  onChange={(e) => updateField("subjectName", e.target.value)}
                  placeholder="예: 자료구조, 운영체제, 알고리즘"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">수강 학기</Label>
                <Input
                  id="semester"
                  value={String(formData.semester || "")}
                  onChange={(e) => updateField("semester", e.target.value)}
                  placeholder="예: 2학년 2학기"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaderName">스터디장</Label>
                <Input
                  id="leaderName"
                  value={String(formData.leaderName || "")}
                  onChange={(e) => updateField("leaderName", e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>
            </>
          )}

          {category === "growth-log" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">블로그 글 제목 *</Label>
                <Input
                  id="title"
                  value={String(formData.title || "")}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="예: Next.js 14 App Router 마이그레이션 후기"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field">기술 분야</Label>
                <Input
                  id="field"
                  value={String(formData.field || "")}
                  onChange={(e) => updateField("field", e.target.value)}
                  placeholder="예: Frontend, Backend, DevOps, AI/ML"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorName">작성자</Label>
                <Input
                  id="authorName"
                  value={String(formData.authorName || "")}
                  onChange={(e) => updateField("authorName", e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">미리보기 텍스트</Label>
                <Textarea
                  id="excerpt"
                  value={String(formData.excerpt || "")}
                  onChange={(e) => updateField("excerpt", e.target.value.slice(0, 200))}
                  maxLength={200}
                  placeholder="블로그 글의 핵심 내용을 요약해주세요"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {String(formData.excerpt || "").length}/200
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blogUrl">블로그 링크 *</Label>
                <Input
                  id="blogUrl"
                  value={String(formData.blogUrl || "")}
                  onChange={(e) => updateField("blogUrl", e.target.value)}
                  placeholder="블로그 글 URL"
                />
                <p className="text-xs text-muted-foreground">클릭 시 이 링크로 이동합니다.</p>
              </div>
            </>
          )}

          {category === "lecture" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="lectureName">특강 주제 *</Label>
                <Input
                  id="lectureName"
                  value={String(formData.lectureName || "")}
                  onChange={(e) => updateField("lectureName", e.target.value)}
                  placeholder="예: 스타트업에서 살아남는 개발자 커리어"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speakerOrganization">연사 소속 회사/기관</Label>
                <Input
                  id="speakerOrganization"
                  value={String(formData.speakerOrganization || "")}
                  onChange={(e) => updateField("speakerOrganization", e.target.value)}
                  placeholder="예: 카카오, 네이버, 토스"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speakerTitle">연사 이름 · 직함</Label>
                <Input
                  id="speakerTitle"
                  value={String(formData.speakerTitle || "")}
                  onChange={(e) => updateField("speakerTitle", e.target.value)}
                  placeholder="예: 홍길동 · 시니어 엔지니어"
                />
              </div>
              <div className="space-y-2">
                <Label>특강 진행일</Label>
                <DatePicker
                  value={formData.lectureDate as Date | undefined}
                  onChange={(date) => updateField("lectureDate", date)}
                  placeholder="날짜 선택"
                />
              </div>
            </>
          )}

          {category === "growth-talk" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">토크 주제 *</Label>
                <Input
                  id="title"
                  value={String(formData.title || "")}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="예: 주니어 개발자의 취업 준비 이야기"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field">토크 분야</Label>
                <Input
                  id="field"
                  value={String(formData.field || "")}
                  onChange={(e) => updateField("field", e.target.value)}
                  placeholder="예: 개발, 커리어, 학사, 취업"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hostName">진행자</Label>
                <Input
                  id="hostName"
                  value={String(formData.hostName || "")}
                  onChange={(e) => updateField("hostName", e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label>진행일</Label>
                <DatePicker
                  value={formData.eventDate as Date | undefined}
                  onChange={(date) => updateField("eventDate", date)}
                  placeholder="날짜 선택"
                />
              </div>
            </>
          )}

          {category === "club" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="clubName">클럽 이름 *</Label>
                <Input
                  id="clubName"
                  value={String(formData.clubName || "")}
                  onChange={(e) => updateField("clubName", e.target.value)}
                  placeholder="예: 알고리즘 클럽, 독서 클럽"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaderName">클럽장</Label>
                <Input
                  id="leaderName"
                  value={String(formData.leaderName || "")}
                  onChange={(e) => updateField("leaderName", e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">클럽 한 줄 소개</Label>
                <Textarea
                  id="description"
                  value={String(formData.description || "")}
                  onChange={(e) => updateField("description", e.target.value.slice(0, 100))}
                  maxLength={100}
                  placeholder="클럽에서 어떤 활동을 하는지 소개해주세요"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {String(formData.description || "").length}/100
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingActivity ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
