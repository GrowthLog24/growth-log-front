"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
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
import { noticeAdminRepository } from "@/infrastructure/repositories/admin/noticeAdminRepository";

/**
 * 공지사항 생성 페이지
 */
export default function CreateNoticePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    contentMd: "",
    isPinned: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      await noticeAdminRepository.createNotice({
        title: form.title,
        summary: form.summary,
        contentMd: form.contentMd,
        isPinned: form.isPinned,
        publishedAt: Timestamp.now(),
      });
      toast.success("공지사항이 등록되었습니다.");
      router.push("/admin/notices");
    } catch (error) {
      console.error("Failed to create notice:", error);
      toast.error("공지사항 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

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
            <CardTitle>공지사항 작성</CardTitle>
            <CardDescription>새 공지사항을 작성합니다.</CardDescription>
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
                등록
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
