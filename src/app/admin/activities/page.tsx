"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Star, StarOff, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column, ConfirmDialog } from "@/presentation/components/admin";
import { activityAdminRepository } from "@/infrastructure/repositories/admin/activityAdminRepository";
import type { Activity } from "@/domain/entities";

/**
 * 활동 관리 목록 페이지
 */
export default function AdminActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchActivities = async () => {
    try {
      const data = await activityAdminRepository.getAllActivities();
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      toast.error("활동을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleToggleFeatured = async (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await activityAdminRepository.toggleFeatured(activity.id, !activity.isFeatured);
      toast.success(activity.isFeatured ? "Featured 해제되었습니다." : "Featured로 설정되었습니다.");
      fetchActivities();
    } catch (error) {
      console.error("Failed to toggle featured:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await activityAdminRepository.deleteActivity(deleteTarget.id);
      toast.success("활동이 삭제되었습니다.");
      setDeleteTarget(null);
      fetchActivities();
    } catch (error) {
      console.error("Failed to delete activity:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Activity>[] = [
    {
      key: "category",
      header: "카테고리",
      cell: (row) => <Badge variant="outline">{row.category}</Badge>,
      className: "w-[120px]",
    },
    {
      key: "title",
      header: "제목",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {row.summary}
            </p>
          </div>
          {row.externalUrl && (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "generation",
      header: "기수",
      cell: (row) => `${row.generation}기`,
      className: "w-[60px]",
    },
    {
      key: "isFeatured",
      header: "Featured",
      cell: (row) =>
        row.isFeatured ? <Badge>Featured</Badge> : null,
      className: "w-[80px]",
    },
    {
      key: "publishedAt",
      header: "게시일",
      cell: (row) => row.publishedAt?.toDate().toLocaleDateString("ko-KR"),
      className: "w-[100px]",
    },
    {
      key: "actions",
      header: "작업",
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleToggleFeatured(row, e)}
            title={row.isFeatured ? "Featured 해제" : "Featured 설정"}
          >
            {row.isFeatured ? (
              <StarOff className="h-4 w-4" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/activities/${row.id}/edit`)}
            title="수정"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(row)}
            title="삭제"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "w-[150px]",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          총 {activities.length}개의 활동
        </p>
        <Button asChild>
          <Link href="/admin/activities/create">
            <Plus className="mr-2 h-4 w-4" />
            활동 추가
          </Link>
        </Button>
      </div>

      {/* 테이블 */}
      <DataTable
        columns={columns}
        data={activities}
        loading={loading}
        emptyMessage="등록된 활동이 없습니다."
        onRowClick={(row) => router.push(`/admin/activities/${row.id}/edit`)}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="활동 삭제"
        description={`"${deleteTarget?.title}" 활동을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
