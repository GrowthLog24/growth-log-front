"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column, ConfirmDialog } from "@/presentation/components/admin";
import { testimonialAdminRepository } from "@/infrastructure/repositories/admin/testimonialAdminRepository";
import type { Testimonial } from "@/domain/entities";

/**
 * 멤버 후기 관리 목록 페이지
 */
export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTestimonials = async () => {
    try {
      const data = await testimonialAdminRepository.getAllTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
      toast.error("멤버 후기를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleToggleActive = async (testimonial: Testimonial, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await testimonialAdminRepository.toggleActive(testimonial.id, !testimonial.isActive);
      toast.success(testimonial.isActive ? "비활성화되었습니다." : "활성화되었습니다.");
      fetchTestimonials();
    } catch (error) {
      console.error("Failed to toggle active:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await testimonialAdminRepository.deleteTestimonial(deleteTarget.id);
      toast.success("멤버 후기가 삭제되었습니다.");
      setDeleteTarget(null);
      fetchTestimonials();
    } catch (error) {
      console.error("Failed to delete testimonial:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Testimonial>[] = [
    {
      key: "category",
      header: "직무",
      cell: (row) => <Badge variant="outline">{row.category}</Badge>,
      className: "w-[120px]",
    },
    {
      key: "name",
      header: "멤버",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground">{row.generation}기</p>
        </div>
      ),
      className: "w-[120px]",
    },
    {
      key: "content",
      header: "후기 내용",
      cell: (row) => (
        <p className="line-clamp-2 text-sm">{row.content}</p>
      ),
    },
    {
      key: "order",
      header: "순서",
      cell: (row) => row.order,
      className: "w-[60px]",
    },
    {
      key: "isActive",
      header: "상태",
      cell: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "활성" : "비활성"}
        </Badge>
      ),
      className: "w-[80px]",
    },
    {
      key: "actions",
      header: "작업",
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleToggleActive(row, e)}
            title={row.isActive ? "비활성화" : "활성화"}
          >
            {row.isActive ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/testimonials/${row.id}/edit`)}
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
          총 {testimonials.length}개의 멤버 후기
        </p>
        <Button asChild>
          <Link href="/admin/testimonials/create">
            <Plus className="mr-2 h-4 w-4" />
            멤버 후기 추가
          </Link>
        </Button>
      </div>

      {/* 테이블 */}
      <DataTable
        columns={columns}
        data={testimonials}
        loading={loading}
        emptyMessage="등록된 멤버 후기가 없습니다."
        onRowClick={(row) => router.push(`/admin/testimonials/${row.id}/edit`)}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="멤버 후기 삭제"
        description={`"${deleteTarget?.name}"님의 후기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
