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
import { testimonialAdminRepository } from "@/infrastructure/repositories/admin/testimonialAdminRepository";

/**
 * 멤버 후기 수정 페이지
 */
export default function EditTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const testimonialId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "",
    name: "",
    generation: 1,
    content: "",
    avatarPath: "",
    order: 1,
    isActive: true,
  });

  useEffect(() => {
    const fetchTestimonial = async () => {
      try {
        const testimonial =
          await testimonialAdminRepository.getTestimonialById(testimonialId);
        if (testimonial) {
          setForm({
            category: testimonial.category,
            name: testimonial.name,
            generation: testimonial.generation,
            content: testimonial.content,
            avatarPath: testimonial.avatarPath || "",
            order: testimonial.order,
            isActive: testimonial.isActive,
          });
        } else {
          toast.error("멤버 후기를 찾을 수 없습니다.");
          router.push("/admin/testimonials");
        }
      } catch (error) {
        console.error("Failed to fetch testimonial:", error);
        toast.error("멤버 후기를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonial();
  }, [testimonialId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    if (!form.content.trim()) {
      toast.error("후기 내용을 입력해주세요.");
      return;
    }
    if (!form.category.trim()) {
      toast.error("직무 카테고리를 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      await testimonialAdminRepository.updateTestimonial(testimonialId, {
        category: form.category,
        name: form.name,
        generation: form.generation,
        content: form.content,
        ...(form.avatarPath ? { avatarPath: form.avatarPath } : {}),
        order: form.order,
        isActive: form.isActive,
      });
      toast.success("멤버 후기가 수정되었습니다.");
      router.push("/admin/testimonials");
    } catch (error) {
      console.error("Failed to update testimonial:", error);
      toast.error("멤버 후기 수정에 실패했습니다.");
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
        <Card>
          <CardHeader>
            <CardTitle>멤버 후기 수정</CardTitle>
            <CardDescription>멤버 후기 내용을 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="멤버 이름"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">직무 카테고리 *</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="예: Back-End, Front-End"
                />
              </div>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">후기 내용 *</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="멤버 후기 내용을 작성하세요."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarPath">프로필 이미지 경로</Label>
              <Input
                id="avatarPath"
                value={form.avatarPath}
                onChange={(e) =>
                  setForm({ ...form, avatarPath: e.target.value })
                }
                placeholder="Storage 경로 또는 URL (선택)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">노출 순서</Label>
              <Input
                id="order"
                type="number"
                min={1}
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: Number(e.target.value) })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isActive: checked })
                }
              />
              <Label htmlFor="isActive">활성화</Label>
            </div>
          </CardContent>
        </Card>

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
