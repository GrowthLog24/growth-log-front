"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/presentation/components/admin/common";
import { activityAdminRepository } from "@/infrastructure/repositories/admin/activityAdminRepository";
import { meetingAdminRepository } from "@/infrastructure/repositories/admin/meetingAdminRepository";
import { uploadFile, generateStoragePath } from "@/infrastructure/firebase/storage";
import type { GrowthLogActivity, Meeting, Member } from "@/domain/entities";

interface MemberGrowthLogPanelProps {
  member: Member;
}

/** 미리보기 텍스트 최대 길이 */
const EXCERPT_MAX_LENGTH = 200;

interface LogForm {
  blogUrl: string;
  title: string;
  field: string;
  excerpt: string;
  meetingId: string;
  thumbnailUrl: string;
  /** OG에서 받아온 이미지 (data URI). 저장 시 Storage에 업로드됩니다. */
  thumbnailDataUri: string;
  /** 홈페이지 활동 기록에도 노출할지 여부 */
  showOnHome: boolean;
}

const EMPTY_FORM: LogForm = {
  blogUrl: "",
  title: "",
  field: "",
  excerpt: "",
  meetingId: "",
  thumbnailUrl: "",
  thumbnailDataUri: "",
  // 회원 상세에서 등록하는 일지는 개인 기록이 목적이므로 기본은 홈 비노출입니다.
  showOnHome: false,
};

/**
 * 회원의 성장일지 관리 패널
 */
export function MemberGrowthLogPanel({ member }: MemberGrowthLogPanelProps) {
  const [logs, setLogs] = useState<GrowthLogActivity[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingOg, setFetchingOg] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<LogForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<GrowthLogActivity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [activities, allMeetings] = await Promise.all([
        activityAdminRepository.getAllActivities(),
        meetingAdminRepository.getAll(),
      ]);

      // memberId로 연결된 일지와, 아직 연결되지 않은 과거 데이터(이름+기수)를 함께 보여줍니다.
      const memberLogs = activities.filter((activity): activity is GrowthLogActivity => {
        if (activity.category !== "growth-log") return false;
        const log = activity as GrowthLogActivity;
        if (log.memberId) return log.memberId === member.id;
        return (
          log.authorName === member.memberName &&
          log.generation === member.generation
        );
      });

      setLogs(memberLogs.sort((a, b) => (b.round ?? 0) - (a.round ?? 0)));
      setMeetings(
        allMeetings
          .filter((meeting) => meeting.generation === member.generation)
          .sort((a, b) => b.round - a.round)
      );
    } catch (error) {
      console.error("Failed to fetch growth logs:", error);
      toast.error("성장일지를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [member.id, member.memberName, member.generation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditForm = (log: GrowthLogActivity) => {
    setEditingId(log.id);
    setForm({
      blogUrl: log.blogUrl ?? "",
      title: log.title ?? "",
      field: log.field ?? "",
      excerpt: log.excerpt ?? "",
      meetingId: log.meetingId ?? "",
      thumbnailUrl: log.thumbnailUrl ?? "",
      thumbnailDataUri: "",
      showOnHome: log.showOnHome === true,
    });
    setFormOpen(true);
  };

  /**
   * 블로그 링크의 OG 메타를 불러와 제목·요약·썸네일을 채웁니다.
   */
  const handleFetchOg = async () => {
    const blogUrl = form.blogUrl.trim();
    if (!blogUrl) {
      toast.error("블로그 링크를 먼저 입력해주세요.");
      return;
    }

    setFetchingOg(true);
    try {
      const response = await fetch("/api/og-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blogUrl }),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: "" }));
        toast.error(error || "글 정보를 불러오지 못했습니다.");
        return;
      }

      const preview: {
        title: string;
        description: string;
        image: string | null;
      } = await response.json();

      setForm((prev) => ({
        ...prev,
        title: preview.title || prev.title,
        excerpt: (preview.description || prev.excerpt).slice(0, EXCERPT_MAX_LENGTH),
        thumbnailDataUri: preview.image ?? prev.thumbnailDataUri,
      }));

      toast.success("글 정보를 불러왔습니다.");
    } catch (error) {
      console.error("Failed to fetch OG preview:", error);
      toast.error("글 정보를 불러오지 못했습니다.");
    } finally {
      setFetchingOg(false);
    }
  };

  const handleSave = async () => {
    if (!form.blogUrl.trim()) {
      toast.error("블로그 링크를 입력해주세요.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요. (글 정보 불러오기를 사용해보세요)");
      return;
    }

    setSaving(true);
    try {
      // OG 썸네일은 외부 URL을 직접 참조하지 않고 Storage에 업로드합니다.
      let thumbnailUrl = form.thumbnailUrl;
      if (form.thumbnailDataUri) {
        const blob = await (await fetch(form.thumbnailDataUri)).blob();
        const extension = blob.type.split("/")[1]?.split("+")[0] || "jpg";
        const file = new File([blob], `og-thumbnail.${extension}`, {
          type: blob.type,
        });
        const path = generateStoragePath("activities/growth-log/thumbnails", file.name);
        thumbnailUrl = await uploadFile(file, path);
      }

      const meeting = meetings.find((item) => item.id === form.meetingId);
      const payload = {
        thumbnailUrl,
        generation: member.generation,
        order: 0,
        isActive: true,
        showOnHome: form.showOnHome,
        title: form.title.trim(),
        field: form.field.trim(),
        authorName: member.memberName,
        memberId: member.id,
        meetingId: meeting?.id ?? "",
        round: meeting?.round ?? 0,
        excerpt: form.excerpt.trim(),
        blogUrl: form.blogUrl.trim(),
      };

      if (editingId) {
        await activityAdminRepository.updateGrowthLog(editingId, payload);
        toast.success("수정되었습니다.");
      } else {
        await activityAdminRepository.addGrowthLog(payload);
        toast.success("등록되었습니다.");
      }

      setFormOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await fetchData();
    } catch (error) {
      console.error("Failed to save growth log:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * 이름으로만 매칭된 글을 이 회원에게 명시적으로 연결합니다.
   *
   * 공개 업적 페이지는 memberId로만 조회하므로, 이 연결을 거쳐야
   * 회원 페이지에 표시됩니다.
   */
  const handleLink = async (log: GrowthLogActivity) => {
    setSaving(true);
    try {
      await activityAdminRepository.updateGrowthLog(log.id, {
        memberId: member.id,
        authorName: member.memberName,
      });
      toast.success("이 회원의 성장일지로 연결되었습니다.");
      await fetchData();
    } catch (error) {
      console.error("Failed to link growth log:", error);
      toast.error("연결에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await activityAdminRepository.deleteActivity(deleteTarget.id);
      toast.success("삭제되었습니다.");
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete growth log:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-card">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const previewImage = form.thumbnailDataUri || form.thumbnailUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          등록된 성장일지 {logs.length}편
        </p>
        {!formOpen && (
          <Button onClick={openCreateForm}>
            <Plus className="mr-1 h-4 w-4" />
            성장일지 추가
          </Button>
        )}
      </div>

      {/* 등록/수정 폼 */}
      {formOpen && (
        <div className="space-y-4 rounded-lg border border-primary/40 bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              {editingId ? "성장일지 수정" : "성장일지 추가"}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blogUrl">블로그 링크 *</Label>
            <div className="flex gap-2">
              <Input
                id="blogUrl"
                value={form.blogUrl}
                onChange={(e) => setForm({ ...form, blogUrl: e.target.value })}
                placeholder="https://blog.example.com/post"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchOg}
                disabled={fetchingOg}
                className="shrink-0"
              >
                {fetchingOg ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                글 정보 불러오기
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              링크를 붙여넣고 불러오면 제목·요약·썸네일이 자동으로 채워집니다.
            </p>
          </div>

          {previewImage && (
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-24 overflow-hidden rounded-md border border-border bg-muted">
                <Image
                  src={previewImage}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized={previewImage.startsWith("data:")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                썸네일 미리보기
                {form.thumbnailDataUri && " (저장 시 업로드됩니다)"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="field">기술 분야</Label>
              <Input
                id="field"
                value={form.field}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                placeholder="예: Frontend"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingId">제출 회차</Label>
              <select
                id="meetingId"
                value={form.meetingId}
                onChange={(e) => setForm({ ...form, meetingId: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">회차 미지정</option>
                {meetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.round}회차 · {meeting.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">미리보기 텍스트</Label>
            <Textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) =>
                setForm({
                  ...form,
                  excerpt: e.target.value.slice(0, EXCERPT_MAX_LENGTH),
                })
              }
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.excerpt.length}/{EXCERPT_MAX_LENGTH}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="showOnHome">홈페이지 활동 기록에도 노출</Label>
              <p className="text-xs text-muted-foreground">
                기본은 개인 업적 페이지에만 표시됩니다.
              </p>
            </div>
            <Switch
              id="showOnHome"
              checked={form.showOnHome}
              onCheckedChange={(checked) => setForm({ ...form, showOnHome: checked })}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {editingId ? "수정" : "등록"}
            </Button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          등록된 성장일지가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {log.thumbnailUrl ? (
                  <Image
                    src={log.thumbnailUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground/40" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {log.round && log.round > 0 ? `${log.round}회차` : "회차 미지정"}
                  </span>
                  {log.field && (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {log.field}
                    </span>
                  )}
                  {!log.memberId && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">
                      미연결 · 업적 페이지에 표시되지 않음
                    </span>
                  )}
                  {log.showOnHome === false && (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      홈 비노출
                    </span>
                  )}
                </div>

                <p className="truncate font-medium text-foreground">{log.title}</p>
                {log.excerpt && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {log.excerpt}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                {!log.memberId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLink(log)}
                    disabled={saving}
                  >
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    연결
                  </Button>
                )}
                {log.blogUrl && (
                  <Button variant="ghost" size="icon" asChild title="글 열기">
                    <a href={log.blogUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditForm(log)}
                >
                  수정
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(log)}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="성장일지 삭제"
        description={`'${deleteTarget?.title ?? ""}'을(를) 삭제하시겠습니까?`}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
