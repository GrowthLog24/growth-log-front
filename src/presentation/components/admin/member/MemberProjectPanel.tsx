"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Boxes, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activityAdminRepository } from "@/infrastructure/repositories/admin/activityAdminRepository";
import { memberAdminRepository } from "@/infrastructure/repositories/admin/memberAdminRepository";
import type { Member, ProjectActivity } from "@/domain/entities";

interface MemberProjectPanelProps {
  member: Member;
}

/**
 * 회원의 참여 프로젝트 연결 패널
 *
 * 프로젝트 문서의 participantMemberIds를 갱신하는 방식이라,
 * 저장 시 변경된 프로젝트만 개별로 업데이트합니다.
 */
export function MemberProjectPanel({ member }: MemberProjectPanelProps) {
  const [projects, setProjects] = useState<ProjectActivity[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activities = await activityAdminRepository.getAllActivities();

      // 회원 기수의 프로젝트만 대상으로 합니다.
      const targetProjects = activities
        .filter(
          (activity): activity is ProjectActivity =>
            activity.category === "project" &&
            activity.generation === member.generation
        )
        .sort((a, b) => a.order - b.order);

      const linked = new Set(
        targetProjects
          .filter(
            (project) =>
              project.participantMemberIds?.includes(member.id) ||
              // 참여자 정보가 없는 과거 데이터는 프로젝트장 이름으로 간주합니다.
              (!project.participantMemberIds?.length &&
                project.leaderName === member.memberName)
          )
          .map((project) => project.id)
      );

      setProjects(targetProjects);
      setSelectedIds(new Set(linked));
      setInitialIds(new Set(linked));
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("프로젝트를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [member.id, member.generation, member.memberName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggle = (projectId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    // 선택 상태가 바뀐 프로젝트만 갱신합니다.
    const changed = projects.filter(
      (project) => selectedIds.has(project.id) !== initialIds.has(project.id)
    );

    if (changed.length === 0) {
      toast.info("변경된 내용이 없습니다.");
      return;
    }

    setSaving(true);
    try {
      const allMembers = await memberAdminRepository.getAll();

      for (const project of changed) {
        const current = project.participantMemberIds ?? [];
        const nextIds = selectedIds.has(project.id)
          ? [...new Set([...current, member.id])]
          : current.filter((id) => id !== member.id);

        // 표시용 이름 배열도 함께 맞춰줍니다.
        const nextNames = nextIds
          .map((id) => allMembers.find((m) => m.id === id)?.memberName)
          .filter((name): name is string => Boolean(name));

        await activityAdminRepository.updateProject(project.id, {
          participantMemberIds: nextIds,
          participantNames: nextNames,
        });
      }

      toast.success(`${changed.length}건의 프로젝트 연결이 저장되었습니다.`);
      await fetchData();
    } catch (error) {
      console.error("Failed to save project links:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-card">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {member.generation}기에 등록된 프로젝트가 없습니다.
        <br />
        &apos;활동 기록&apos; 메뉴에서 프로젝트를 먼저 추가해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {member.generation}기 프로젝트 {projects.length}건 중 {selectedIds.size}건
          참여
        </p>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          연결 저장
        </Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {projects.map((project) => {
          const selected = selectedIds.has(project.id);
          return (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => toggle(project.id)}
                className={`flex w-full gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {project.thumbnailUrl ? (
                    <Image
                      src={project.thumbnailUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <Boxes className="h-5 w-5 text-muted-foreground/40" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {project.projectName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {project.platform} · PM {project.leaderName}
                  </p>
                  {selected && (
                    <span className="mt-1 inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      참여
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
