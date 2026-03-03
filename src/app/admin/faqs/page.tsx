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
import {
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConfirmDialog } from "@/presentation/components/admin";
import { MarkdownContent } from "@/presentation/components/common";
import { faqAdminRepository } from "@/infrastructure/repositories/admin/faqAdminRepository";
import { faqCategoryAdminRepository } from "@/infrastructure/repositories/admin/faqCategoryAdminRepository";
import type { FAQ, FAQCategoryItem } from "@/domain/entities";

/**
 * 드래그 가능한 FAQ 아이템
 */
interface SortableFAQItemProps {
  faq: FAQ;
  onToggleActive: (faq: FAQ) => void;
  onEdit: (faq: FAQ) => void;
  onDelete: (faq: FAQ) => void;
}

function SortableFAQItem({ faq, onToggleActive, onEdit, onDelete }: SortableFAQItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem
        value={faq.id}
        className={`bg-white rounded-lg px-4 ${!faq.isActive ? "opacity-60" : ""}`}
      >
        <div className="flex items-center w-full">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground py-4 pr-2 touch-none shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <AccordionTrigger className="flex-1 text-left hover:no-underline pr-4">
            <div className="flex items-center gap-2">
              <span>{faq.question}</span>
              {!faq.isActive && (
                <Badge variant="secondary" className="text-xs">비활성</Badge>
              )}
            </div>
          </AccordionTrigger>
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(faq);
              }}
              title={faq.isActive ? "비활성화" : "활성화"}
            >
              {faq.isActive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(faq);
              }}
              title="수정"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(faq);
              }}
              title="삭제"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <AccordionContent className="pl-6">
          <MarkdownContent content={faq.answerMd} className="text-muted-foreground" />
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

/**
 * FAQ 관리 목록 페이지
 */
export default function AdminFAQsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  // 카테고리 상태
  const [categories, setCategories] = useState<FAQCategoryItem[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // 드래그 앤 드롭 센서
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCategories = async () => {
    try {
      const data = await faqCategoryAdminRepository.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchFAQs = async () => {
    try {
      const data = await faqAdminRepository.getAllFAQs();
      setFaqs(data);
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
      toast.error("FAQ를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchCategories(), fetchFAQs()]);
  }, []);

  // 카테고리별 FAQ 그룹화
  const groupedFAQs: Record<string, FAQ[]> = {};
  categories.forEach((cat) => {
    groupedFAQs[cat.name] = faqs
      .filter((f) => f.category === cat.name)
      .sort((a, b) => a.order - b.order);
  });

  // 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("카테고리 이름을 입력해주세요.");
      return;
    }

    setAddingCategory(true);
    try {
      await faqCategoryAdminRepository.addCategory(newCategoryName.trim(), categories.length);
      setNewCategoryName("");
      await fetchCategories();
      toast.success("카테고리가 추가되었습니다.");
    } catch (error) {
      console.error("Failed to add category:", error);
      toast.error("카테고리 추가에 실패했습니다.");
    } finally {
      setAddingCategory(false);
    }
  };

  // 카테고리 수정
  const handleUpdateCategory = async (id: string) => {
    if (!editingCategoryName.trim()) {
      toast.error("카테고리 이름을 입력해주세요.");
      return;
    }

    try {
      await faqCategoryAdminRepository.updateCategory(id, editingCategoryName.trim());
      setEditingCategoryId(null);
      setEditingCategoryName("");
      await fetchCategories();
      toast.success("카테고리가 수정되었습니다.");
    } catch (error) {
      console.error("Failed to update category:", error);
      toast.error("카테고리 수정에 실패했습니다.");
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (id: string) => {
    const categoryName = categories.find((c) => c.id === id)?.name;
    const faqsInCategory = faqs.filter((f) => f.category === categoryName);

    if (faqsInCategory.length > 0) {
      toast.error(`이 카테고리에 ${faqsInCategory.length}개의 FAQ가 있습니다. 먼저 FAQ를 삭제해주세요.`);
      return;
    }

    if (!confirm("이 카테고리를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await faqCategoryAdminRepository.deleteCategory(id);
      await fetchCategories();
      toast.success("카테고리가 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("카테고리 삭제에 실패했습니다.");
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      await faqAdminRepository.toggleActive(faq.id, !faq.isActive);
      toast.success(faq.isActive ? "비활성화되었습니다." : "활성화되었습니다.");
      fetchFAQs();
    } catch (error) {
      console.error("Failed to toggle active:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await faqAdminRepository.deleteFAQ(deleteTarget.id);
      toast.success("FAQ가 삭제되었습니다.");
      setDeleteTarget(null);
      fetchFAQs();
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 드래그 앤 드롭 완료 핸들러
  const handleDragEnd = async (categoryName: string, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const categoryFaqs = groupedFAQs[categoryName];
    const oldIndex = categoryFaqs.findIndex((f) => f.id === active.id);
    const newIndex = categoryFaqs.findIndex((f) => f.id === over.id);

    // 로컬 상태 먼저 업데이트
    const newFaqs = arrayMove(categoryFaqs, oldIndex, newIndex);
    setFaqs((prev) => {
      const otherFaqs = prev.filter((f) => f.category !== categoryName);
      return [...otherFaqs, ...newFaqs];
    });

    // 서버에 순서 저장
    setReordering(true);
    try {
      const faqOrders = newFaqs.map((faq, index) => ({
        id: faq.id,
        order: index,
      }));
      await faqAdminRepository.updateFAQsOrder(faqOrders);
      toast.success("순서가 변경되었습니다.");
    } catch (error) {
      console.error("Failed to reorder FAQs:", error);
      toast.error("순서 변경에 실패했습니다.");
      fetchFAQs();
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
    <div className="space-y-6">
      {/* 카테고리 관리 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리 관리</CardTitle>
          <CardDescription>
            FAQ 카테고리를 추가하고 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 카테고리 목록 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-6"
              >
                {editingCategoryId === category.id ? (
                  <>
                    <Input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="h-7 w-32 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateCategory(category.id);
                        if (e.key === "Escape") {
                          setEditingCategoryId(null);
                          setEditingCategoryName("");
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => handleUpdateCategory(category.id)}
                    >
                      저장
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className="text-sm cursor-pointer hover:text-primary"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setEditingCategoryName(category.name);
                      }}
                    >
                      {category.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({groupedFAQs[category.name]?.length || 0})
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 ml-1"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                등록된 카테고리가 없습니다.
              </p>
            )}
          </div>

          {/* 카테고리 추가 */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="새 카테고리 이름"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
              }}
              className="w-48"
            />
            <Button
              onClick={handleAddCategory}
              disabled={addingCategory || !newCategoryName.trim()}
              size="sm"
            >
              {addingCategory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  추가
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ 목록 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">FAQ 목록</h2>
          <p className="text-sm text-muted-foreground">
            총 {faqs.length}개의 FAQ · 드래그하여 순서를 변경할 수 있습니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/faqs/create">
            <Plus className="mr-2 h-4 w-4" />
            FAQ 추가
          </Link>
        </Button>
      </div>

      {/* FAQ 2단 그리드 (홈페이지와 동일) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${reordering ? "opacity-50 pointer-events-none" : ""}`}>
        {categories.map((category) => {
          const categoryFaqs = groupedFAQs[category.name] || [];

          return (
            <div key={category.id}>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full" />
                {category.name}
                <span className="text-sm font-normal text-muted-foreground">
                  ({categoryFaqs.length})
                </span>
              </h3>

              {categoryFaqs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-gray-6 rounded-lg">
                  <p className="text-sm">등록된 FAQ가 없습니다.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(category.name, event)}
                >
                  <SortableContext
                    items={categoryFaqs.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Accordion type="single" collapsible className="space-y-2">
                      {categoryFaqs.map((faq) => (
                        <SortableFAQItem
                          key={faq.id}
                          faq={faq}
                          onToggleActive={handleToggleActive}
                          onEdit={(f) => router.push(`/admin/faqs/${f.id}/edit`)}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                    </Accordion>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>먼저 카테고리를 추가해주세요.</p>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="FAQ 삭제"
        description={`"${deleteTarget?.question}" FAQ를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
