"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { activityRepository } from "@/infrastructure/repositories/activityRepository";
import { activityAdminRepository } from "@/infrastructure/repositories/admin/activityAdminRepository";
import type { ActivityCategory, ExternalPlatform } from "@/domain/entities";

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "프로젝트",
  "학사 스터디",
  "성장일지",
  "전문가 특강",
  "그로스톡",
  "클럽 활동",
];

const EXTERNAL_PLATFORMS: { value: ExternalPlatform; label: string }[] = [
  { value: "blog", label: "블로그" },
  { value: "instagram", label: "인스타그램" },
  { value: "youtube", label: "유튜브" },
  { value: "notion", label: "노션" },
  { value: "other", label: "기타" },
];

/**
 * 활동 수정 페이지
 */
export default function EditActivityPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "" as ActivityCategory | "",
    title: "",
    summary: "",
    thumbnailUrl: "",
    tags: "",
    generation: 1,
    eventDateAt: "",
    isFeatured: false,
    externalUrl: "",
    externalPlatform: "" as ExternalPlatform | "",
    contentMd: "",
  });

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const detail = await activityRepository.getActivityById(activityId);
        if (detail) {
          setForm({
            category: detail.category,
            title: detail.title,
            summary: detail.summary,
            thumbnailUrl: detail.thumbnail?.url || detail.thumbnail?.storagePath || "",
            tags: detail.tags.join(", "),
            generation: detail.generation,
            eventDateAt: detail.eventDateAt
              ? detail.eventDateAt.toDate().toISOString().split("T")[0]
              : "",
            isFeatured: detail.isFeatured,
            externalUrl: detail.externalUrl || "",
            externalPlatform: detail.externalPlatform || "",
            contentMd: detail.body?.contentMd || "",
          });
        } else {
          toast.error("활동을 찾을 수 없습니다.");
          router.push("/admin/activities");
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
        toast.error("활동을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.category) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const activityData = {
        category: form.category as ActivityCategory,
        title: form.title,
        summary: form.summary,
        thumbnail: {
          storagePath: form.thumbnailUrl,
          url: form.thumbnailUrl,
        },
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        generation: form.generation,
        eventDateAt: form.eventDateAt
          ? Timestamp.fromDate(new Date(form.eventDateAt))
          : Timestamp.now(),
        isFeatured: form.isFeatured,
        ...(form.externalUrl && { externalUrl: form.externalUrl }),
        ...(form.externalPlatform && {
          externalPlatform: form.externalPlatform as ExternalPlatform,
        }),
      };

      await activityAdminRepository.updateActivity(
        activityId,
        activityData,
        form.contentMd
      );
      toast.success("활동이 수정되었습니다.");
      router.push("/admin/activities");
    } catch (error) {
      console.error("Failed to update activity:", error);
      toast.error("활동 수정에 실패했습니다.");
    } finally {
      setSaving(false);
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
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>활동 수정</CardTitle>
            <CardDescription>활동 내용을 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>카테고리 *</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm({ ...form, category: value as ActivityCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="활동 제목"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">요약</Label>
              <Input
                id="summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="활동 요약 (목록에 표시됩니다)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="generation">기수</Label>
                <Input
                  id="generation"
                  type="number"
                  min={1}
                  value={form.generation}
                  onChange={(e) =>
                    setForm({ ...form, generation: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDateAt">활동 날짜</Label>
                <Input
                  id="eventDateAt"
                  type="date"
                  value={form.eventDateAt}
                  onChange={(e) =>
                    setForm({ ...form, eventDateAt: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">썸네일 URL</Label>
              <Input
                id="thumbnailUrl"
                value={form.thumbnailUrl}
                onChange={(e) =>
                  setForm({ ...form, thumbnailUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="React, TypeScript, Next.js"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isFeatured"
                checked={form.isFeatured}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isFeatured: checked })
                }
              />
              <Label htmlFor="isFeatured">메인 노출</Label>
            </div>
          </CardContent>
        </Card>

        {/* 외부 링크 */}
        <Card>
          <CardHeader>
            <CardTitle>외부 링크</CardTitle>
            <CardDescription>
              외부 플랫폼 링크가 있다면 입력하세요. (선택)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="externalUrl">URL</Label>
              <Input
                id="externalUrl"
                value={form.externalUrl}
                onChange={(e) =>
                  setForm({ ...form, externalUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>플랫폼</Label>
              <Select
                value={form.externalPlatform}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    externalPlatform: value as ExternalPlatform,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="플랫폼 선택" />
                </SelectTrigger>
                <SelectContent>
                  {EXTERNAL_PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 본문 */}
        <Card>
          <CardHeader>
            <CardTitle>본문 내용</CardTitle>
            <CardDescription>Markdown 형식으로 작성하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.contentMd}
              onChange={(e) =>
                setForm({ ...form, contentMd: e.target.value })
              }
              placeholder="활동 본문 내용을 Markdown 형식으로 작성하세요."
              rows={15}
            />
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                저장
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
