"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Upload, X } from "lucide-react";
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
import { uploadFile, generateStoragePath } from "@/infrastructure/firebase";

/**
 * 멤버 후기 생성 페이지
 */
export default function CreateTestimonialPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "",
    name: "",
    generation: "",
    content: "",
    isActive: true,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드할 수 있습니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기는 5MB 이하여야 합니다.");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      let avatarPath: string | undefined;

      // 프로필 이미지 업로드
      if (avatarFile) {
        const storagePath = generateStoragePath("testimonials", avatarFile.name);
        avatarPath = await uploadFile(avatarFile, storagePath);
      }

      await testimonialAdminRepository.createTestimonialWithAutoOrder({
        category: form.category,
        name: form.name,
        generation: parseInt(form.generation) || 1,
        content: form.content,
        ...(avatarPath && { avatarPath }),
        isActive: form.isActive,
      });
      toast.success("멤버 후기가 등록되었습니다.");
      router.push("/admin/testimonials");
    } catch (error) {
      console.error("Failed to create testimonial:", error);
      toast.error("멤버 후기 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>멤버 후기 등록</CardTitle>
            <CardDescription>새 멤버 후기를 등록합니다.</CardDescription>
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
                <div className="relative">
                  <Input
                    id="generation"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.generation}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setForm({ ...form, generation: value });
                    }}
                    className="pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    기
                  </span>
                </div>
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
              <Label>프로필 이미지</Label>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <div className="relative group">
                    <Image
                      src={avatarPreview}
                      alt="프로필 미리보기"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 p-1 bg-background border border-border rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-6"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-6 flex items-center justify-center border border-dashed">
                    <span className="text-xs text-muted-foreground">없음</span>
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    이미지 선택
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG (최대 5MB)
                  </p>
                </div>
              </div>
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
                등록
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
