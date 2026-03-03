"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column, ConfirmDialog } from "@/presentation/components/admin";
import { noticeRepository } from "@/infrastructure/repositories/noticeRepository";
import { noticeAdminRepository } from "@/infrastructure/repositories/admin/noticeAdminRepository";
import type { Notice } from "@/domain/entities";

/**
 * 공지사항 관리 목록 페이지
 */
export default function AdminNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotices = async () => {
    try {
      const data = await noticeRepository.getNotices();
      setNotices(data);
    } catch (error) {
      console.error("Failed to fetch notices:", error);
      toast.error("공지사항을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleTogglePinned = async (notice: Notice, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await noticeAdminRepository.togglePinned(notice.id, !notice.isPinned);
      toast.success(notice.isPinned ? "고정이 해제되었습니다." : "공지사항이 고정되었습니다.");
      fetchNotices();
    } catch (error) {
      console.error("Failed to toggle pinned:", error);
      toast.error("고정 상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await noticeAdminRepository.deleteNotice(deleteTarget.id);
      toast.success("공지사항이 삭제되었습니다.");
      setDeleteTarget(null);
      fetchNotices();
    } catch (error) {
      console.error("Failed to delete notice:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Notice>[] = [
    {
      key: "isPinned",
      header: "고정",
      cell: (row) =>
        row.isPinned ? (
          <Badge variant="secondary">고정</Badge>
        ) : null,
      className: "w-[60px]",
    },
    {
      key: "title",
      header: "제목",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {row.summary}
          </p>
        </div>
      ),
    },
    {
      key: "publishedAt",
      header: "게시일",
      cell: (row) => row.publishedAt?.toDate().toLocaleDateString("ko-KR"),
      className: "w-[120px]",
    },
    {
      key: "actions",
      header: "작업",
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleTogglePinned(row, e)}
            title={row.isPinned ? "고정 해제" : "고정"}
          >
            {row.isPinned ? (
              <PinOff className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/notices/${row.id}/edit`)}
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
          총 {notices.length}개의 공지사항
        </p>
        <Button asChild>
          <Link href="/admin/notices/create">
            <Plus className="mr-2 h-4 w-4" />
            공지사항 추가
          </Link>
        </Button>
      </div>

      {/* 테이블 */}
      <DataTable
        columns={columns}
        data={notices}
        loading={loading}
        emptyMessage="등록된 공지사항이 없습니다."
        onRowClick={(row) => router.push(`/admin/notices/${row.id}/edit`)}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="공지사항 삭제"
        description={`"${deleteTarget?.title}" 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
