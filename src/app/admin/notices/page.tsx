"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Pin, PinOff, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/presentation/components/admin";
import { noticeRepository } from "@/infrastructure/repositories/noticeRepository";
import { noticeAdminRepository } from "@/infrastructure/repositories/admin/noticeAdminRepository";
import type { Notice } from "@/domain/entities";
import { Loader2 } from "lucide-react";

/**
 * 드래그 가능한 공지사항 행
 */
interface SortableNoticeRowProps {
  notice: Notice;
  onTogglePinned: (notice: Notice, e: React.MouseEvent) => void;
  onEdit: (notice: Notice) => void;
  onDelete: (notice: Notice) => void;
}

function SortableNoticeRow({ notice, onTogglePinned, onEdit, onDelete }: SortableNoticeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: notice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:bg-accent"
      onClick={() => onEdit(notice)}
    >
      <TableCell className="w-[40px]">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell className="w-[60px] align-top">
        {notice.isPinned ? (
          <Badge variant="secondary">고정</Badge>
        ) : null}
      </TableCell>
      <TableCell className="align-top">
        <div>
          <p className="font-medium">{notice.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {notice.summary}
          </p>
        </div>
      </TableCell>
      <TableCell className="w-[120px] align-top">
        {notice.publishedAt?.toDate().toLocaleDateString("ko-KR")}
      </TableCell>
      <TableCell className="w-[150px] align-top">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onTogglePinned(notice, e)}
            title={notice.isPinned ? "고정 해제" : "고정"}
          >
            {notice.isPinned ? (
              <PinOff className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(notice)}
            title="수정"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(notice)}
            title="삭제"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * 공지사항 관리 목록 페이지
 */
export default function AdminNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = notices.findIndex((n) => n.id === active.id);
    const newIndex = notices.findIndex((n) => n.id === over.id);

    const newNotices = arrayMove(notices, oldIndex, newIndex);
    setNotices(newNotices);

    setReordering(true);
    try {
      const orders = newNotices.map((notice, index) => ({
        id: notice.id,
        sortOrder: index,
      }));
      await noticeAdminRepository.updateNoticesOrder(orders);
      toast.success("순서가 변경되었습니다.");
    } catch (error) {
      console.error("Failed to reorder notices:", error);
      toast.error("순서 변경에 실패했습니다.");
      fetchNotices();
    } finally {
      setReordering(false);
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
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          총 {notices.length}개의 공지사항 · 드래그하여 순서를 변경할 수 있습니다.
        </p>
        <Button asChild>
          <Link href="/admin/notices/create">
            <Plus className="mr-2 h-4 w-4" />
            공지사항 추가
          </Link>
        </Button>
      </div>

      {/* 테이블 */}
      {notices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div className={`rounded-md border ${reordering ? "opacity-50 pointer-events-none" : ""}`}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={notices.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]" />
                    <TableHead className="w-[60px]">고정</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead className="w-[120px]">게시일</TableHead>
                    <TableHead className="w-[150px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((notice) => (
                    <SortableNoticeRow
                      key={notice.id}
                      notice={notice}
                      onTogglePinned={handleTogglePinned}
                      onEdit={(n) => router.push(`/admin/notices/${n.id}/edit`)}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        </div>
      )}

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
