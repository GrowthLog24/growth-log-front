"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MarkdownEditor } from "@/presentation/components/common";
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
import { faqAdminRepository } from "@/infrastructure/repositories/admin/faqAdminRepository";
import { faqCategoryAdminRepository } from "@/infrastructure/repositories/admin/faqCategoryAdminRepository";
import type { FAQCategoryItem } from "@/domain/entities";

/**
 * FAQ 생성 페이지
 */
export default function CreateFAQPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<FAQCategoryItem[]>([]);
  const [form, setForm] = useState({
    category: "",
    question: "",
    answerMd: "",
    isActive: true,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await faqCategoryAdminRepository.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("카테고리를 불러오는데 실패했습니다.");
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.category) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }

    if (!form.question.trim()) {
      toast.error("질문을 입력해주세요.");
      return;
    }

    if (!form.answerMd.trim()) {
      toast.error("답변을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      await faqAdminRepository.createFAQWithAutoOrder({
        category: form.category,
        question: form.question,
        answerMd: form.answerMd,
        isActive: form.isActive,
      });
      toast.success("FAQ가 등록되었습니다.");
      router.push("/admin/faqs");
    } catch (error) {
      console.error("Failed to create FAQ:", error);
      toast.error("FAQ 등록에 실패했습니다.");
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
            <CardTitle>FAQ 작성</CardTitle>
            <CardDescription>새 FAQ를 작성합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm({ ...form, category: value })
                }
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">질문 *</Label>
              <Input
                id="question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="자주 묻는 질문"
              />
            </div>

            <div className="space-y-2">
              <Label>답변 *</Label>
              <MarkdownEditor
                value={form.answerMd}
                onChange={(value) => setForm({ ...form, answerMd: value })}
                placeholder="답변 내용을 입력하세요..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="isActive">활성화</Label>
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
