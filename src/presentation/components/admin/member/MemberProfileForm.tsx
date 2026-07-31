"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  memberAdminRepository,
  calculateMemberType,
} from "@/infrastructure/repositories/admin/memberAdminRepository";
import { uploadFile, generateStoragePath } from "@/infrastructure/firebase/storage";
import { convertToJpegIfNeeded } from "@/shared/utils/image";
import type { Member } from "@/domain/entities";

interface MemberProfileFormProps {
  member: Member;
  currentGeneration: number;
  onSaved: (member: Member) => void;
}

/** 한 줄 소개 최대 길이 */
const BIO_MAX_LENGTH = 100;

/**
 * 회원 기본 정보 편집 폼
 */
export function MemberProfileForm({
  member,
  currentGeneration,
  onSaved,
}: MemberProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    memberName: member.memberName,
    generation: String(member.generation),
    isActive: member.isActive,
    bio: member.bio ?? "",
    field: member.field ?? "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(member.profileImageUrl ?? "");

  const previewMemberType = form.generation
    ? calculateMemberType(currentGeneration, Number(form.generation))
    : null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // HEIC 등은 기존 활동 썸네일과 동일하게 JPEG로 변환해 올립니다.
    const file = await convertToJpegIfNeeded(rawFile);
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const generation = Number(form.generation);
    if (!form.memberName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    if (!Number.isInteger(generation) || generation <= 0) {
      toast.error("기수를 올바르게 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      let profileImageUrl = member.profileImageUrl ?? "";
      if (imageFile) {
        const path = generateStoragePath("members/profiles", imageFile.name);
        profileImageUrl = await uploadFile(imageFile, path);
      } else if (!imagePreview) {
        // 미리보기를 비웠으면 이미지도 제거합니다.
        profileImageUrl = "";
      }

      const payload = {
        memberName: form.memberName.trim(),
        generation,
        memberType: calculateMemberType(currentGeneration, generation),
        isActive: form.isActive,
        bio: form.bio.trim(),
        field: form.field.trim(),
        profileImageUrl,
      };

      await memberAdminRepository.update(member.id, payload);
      toast.success("저장되었습니다.");
      setImageFile(null);
      onSaved({ ...member, ...payload });
    } catch (error) {
      console.error("Failed to save member:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 rounded-lg border border-border bg-card p-5">
      {/* 프로필 이미지 */}
      <div className="space-y-2">
        <Label>프로필 이미지</Label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={imagePreview.startsWith("data:")}
              />
            ) : (
              <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                없음
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
              <Upload className="h-4 w-4" />
              이미지 선택
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            {imagePreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                }}
              >
                <X className="h-4 w-4" />
                제거
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="memberName">이름 *</Label>
          <Input
            id="memberName"
            value={form.memberName}
            onChange={(e) => setForm({ ...form, memberName: e.target.value })}
            placeholder="홍길동"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="generation">가입 기수 *</Label>
          <Input
            id="generation"
            type="number"
            min={1}
            value={form.generation}
            onChange={(e) => setForm({ ...form, generation: e.target.value })}
          />
          {previewMemberType && (
            <p className="text-xs text-muted-foreground">
              회원 구분:
              <Badge variant="outline" className="ml-1 text-xs">
                {previewMemberType}
              </Badge>
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field">기술 분야</Label>
        <Input
          id="field"
          value={form.field}
          onChange={(e) => setForm({ ...form, field: e.target.value })}
          placeholder="예: Frontend, Backend, AI/ML"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">한 줄 소개</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) =>
            setForm({ ...form, bio: e.target.value.slice(0, BIO_MAX_LENGTH) })
          }
          rows={2}
          placeholder="업적 페이지 상단에 표시됩니다"
        />
        <p className="text-right text-xs text-muted-foreground">
          {form.bio.length}/{BIO_MAX_LENGTH}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label htmlFor="isActive">가입 여부</Label>
          <p className="text-xs text-muted-foreground">
            끄면 출결 입력 대상에서 제외됩니다.
          </p>
        </div>
        <Switch
          id="isActive"
          checked={form.isActive}
          onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          기본 정보 저장
        </Button>
      </div>
    </div>
  );
}
