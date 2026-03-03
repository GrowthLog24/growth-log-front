"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { noticeRepository } from "@/infrastructure/repositories/noticeRepository";
import { noticeAdminRepository } from "@/infrastructure/repositories/admin/noticeAdminRepository";
import type { Notice } from "@/domain/entities";

/**
 * 공지사항 수정 페이지
 */
export default function EditNoticePage() {
  const router = useRouter();
  const params = useParams();
  const noticeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    contentMd: "",
    isPinned: false,
  });

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const notice = await noticeRepository.getNoticeById(noticeId);
        if (notice) {
          setForm({
            title: notice.title,
            summary: notice.summary,
            contentMd: notice.contentMd,
            isPinned: notice.isPinned,
          });
        } else {
          toast.error("공지사항을 찾을 수 없습니다.");
          router.push("/admin/notices");
        }
      } catch (error) {
        console.error("Failed to fetch notice:", error);
        toast.error("공지사항을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [noticeId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      await noticeAdminRepository.updateNotice(noticeId, {
        title: form.title,
        summary: form.summary,
        contentMd: form.contentMd,
        isPinned: form.isPinned,
      });
      toast.success("공지사항이 수정되었습니다.");
      router.push("/admin/notices");
    } catch (error) {
      console.error("Failed to update notice:", error);
      toast.error("공지사항 수정에 실패했습니다.");
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
      {/* 뒤로가기 */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>공지사항 수정</CardTitle>
            <CardDescription>공지사항 내용을 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="공지사항 제목"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">요약</Label>
              <Input
                id="summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="공지사항 요약 (목록에 표시됩니다)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentMd">내용 (Markdown)</Label>
              <Textarea
                id="contentMd"
                value={form.contentMd}
                onChange={(e) => setForm({ ...form, contentMd: e.target.value })}
                placeholder="공지사항 내용을 Markdown 형식으로 작성하세요."
                rows={15}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isPinned"
                checked={form.isPinned}
                onCheckedChange={(checked) => setForm({ ...form, isPinned: checked })}
              />
              <Label htmlFor="isPinned">상단 고정</Label>
            </div>
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
