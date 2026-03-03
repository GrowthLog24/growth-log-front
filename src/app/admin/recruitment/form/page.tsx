"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  Type,
  Mail,
  Phone,
  List,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/presentation/components/admin";
import { recruitmentAdminRepository } from "@/infrastructure/repositories/admin/recruitmentAdminRepository";
import type { PreRegistrationField, PreRegistrationFieldType } from "@/domain/entities";

const FIELD_TYPE_OPTIONS: { value: PreRegistrationFieldType; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "텍스트", icon: <Type className="h-4 w-4" /> },
  { value: "email", label: "이메일", icon: <Mail className="h-4 w-4" /> },
  { value: "phone", label: "전화번호", icon: <Phone className="h-4 w-4" /> },
  { value: "select", label: "선택 (드롭다운)", icon: <List className="h-4 w-4" /> },
  { value: "textarea", label: "긴 텍스트", icon: <AlignLeft className="h-4 w-4" /> },
];

const getFieldTypeLabel = (type: PreRegistrationFieldType) => {
  return FIELD_TYPE_OPTIONS.find((opt) => opt.value === type)?.label || type;
};

const getFieldTypeIcon = (type: PreRegistrationFieldType) => {
  return FIELD_TYPE_OPTIONS.find((opt) => opt.value === type)?.icon || <Type className="h-4 w-4" />;
};

/**
 * 정렬 가능한 필드 아이템 컴포넌트
 */
interface SortableFieldItemProps {
  field: PreRegistrationField;
  onEdit: (field: PreRegistrationField) => void;
  onDelete: (field: PreRegistrationField) => void;
}

function SortableFieldItem({ field, onEdit, onDelete }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-3 bg-gray-6 rounded-lg group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="p-2 bg-white rounded">
        {getFieldTypeIcon(field.type)}
      </div>
      <div className="flex-1">
        <p className="font-medium">{field.label}</p>
        <p className="text-sm text-muted-foreground">
          {getFieldTypeLabel(field.type)}
          {field.required && " · 필수"}
          {field.options && ` · ${field.options.length}개 옵션`}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(field)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(field)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

/**
 * 사전 신청 폼 관리 페이지
 */
export default function PreRegistrationFormPage() {
  const [fields, setFields] = useState<PreRegistrationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<PreRegistrationField | null>(null);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [fieldType, setFieldType] = useState<PreRegistrationFieldType>("text");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldPlaceholder, setFieldPlaceholder] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState("");

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<PreRegistrationField | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFields = async () => {
    try {
      const data = await recruitmentAdminRepository.getPreRegistrationFormFields();
      setFields(data);
    } catch (error) {
      console.error("Failed to fetch fields:", error);
      toast.error("폼 필드를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const resetForm = () => {
    setFieldType("text");
    setFieldLabel("");
    setFieldPlaceholder("");
    setFieldRequired(false);
    setFieldOptions("");
    setEditingField(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (field: PreRegistrationField) => {
    setEditingField(field);
    setFieldType(field.type);
    setFieldLabel(field.label);
    setFieldPlaceholder(field.placeholder || "");
    setFieldRequired(field.required);
    setFieldOptions(field.options?.join("\n") || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!fieldLabel.trim()) {
      toast.error("필드 라벨을 입력해주세요.");
      return;
    }

    if (fieldType === "select" && !fieldOptions.trim()) {
      toast.error("선택 옵션을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const options = fieldType === "select"
        ? fieldOptions.split("\n").map((o) => o.trim()).filter(Boolean)
        : undefined;

      if (editingField) {
        // 수정
        await recruitmentAdminRepository.updatePreRegistrationFormField(editingField.id, {
          type: fieldType,
          label: fieldLabel.trim(),
          placeholder: fieldPlaceholder.trim() || undefined,
          required: fieldRequired,
          options,
        });
        toast.success("필드가 수정되었습니다.");
      } else {
        // 추가
        const newOrder = fields.length;
        await recruitmentAdminRepository.addPreRegistrationFormField({
          type: fieldType,
          label: fieldLabel.trim(),
          placeholder: fieldPlaceholder.trim() || undefined,
          required: fieldRequired,
          options,
          order: newOrder,
        });
        toast.success("필드가 추가되었습니다.");
      }

      setDialogOpen(false);
      resetForm();
      fetchFields();
    } catch (error) {
      console.error("Failed to save field:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await recruitmentAdminRepository.deletePreRegistrationFormField(deleteTarget.id);
      toast.success("필드가 삭제되었습니다.");
      setDeleteTarget(null);
      fetchFields();
    } catch (error) {
      console.error("Failed to delete field:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 드래그 앤 드롭 완료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    // 로컬 상태 먼저 업데이트 (즉각적인 UI 반영)
    const newFields = arrayMove(fields, oldIndex, newIndex);
    setFields(newFields);

    // 서버에 순서 저장
    setReordering(true);
    try {
      const fieldOrders = newFields.map((field, index) => ({
        id: field.id,
        order: index,
      }));
      await recruitmentAdminRepository.updatePreRegistrationFormFieldsOrder(fieldOrders);
      toast.success("순서가 변경되었습니다.");
    } catch (error) {
      console.error("Failed to reorder fields:", error);
      toast.error("순서 변경에 실패했습니다.");
      // 실패 시 원래 순서로 복원
      fetchFields();
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
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/recruitment">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">사전 신청 폼 관리</h1>
            <p className="text-sm text-muted-foreground">
              사전 신청 시 수집할 정보를 설정합니다.
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          필드 추가
        </Button>
      </div>

      {/* 기본 필드 안내 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">기본 필드</CardTitle>
          <CardDescription>
            이름 필드는 기본으로 포함되며 수정할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-3 bg-gray-6 rounded-lg">
            <div className="p-2 bg-white rounded">
              <Type className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">이름</p>
              <p className="text-sm text-muted-foreground">필수 입력</p>
            </div>
            <Badge variant="secondary">기본</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 커스텀 필드 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">추가 필드</CardTitle>
          <CardDescription>
            {fields.length}개의 추가 필드가 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>추가된 필드가 없습니다.</p>
              <p className="text-sm mt-1">필드를 추가하여 더 많은 정보를 수집하세요.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={`space-y-2 ${reordering ? "opacity-50 pointer-events-none" : ""}`}>
                  {fields.map((field) => (
                    <SortableFieldItem
                      key={field.id}
                      field={field}
                      onEdit={openEditDialog}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField ? "필드 수정" : "필드 추가"}
            </DialogTitle>
            <DialogDescription>
              사전 신청 폼에 표시될 필드 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>필드 유형</Label>
              <Select
                value={fieldType}
                onValueChange={(value) => setFieldType(value as PreRegistrationFieldType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">라벨 (필드명)</Label>
              <Input
                id="label"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                placeholder="예: 연락처, 관심 분야"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placeholder">플레이스홀더 (선택)</Label>
              <Input
                id="placeholder"
                value={fieldPlaceholder}
                onChange={(e) => setFieldPlaceholder(e.target.value)}
                placeholder="예: 010-0000-0000"
              />
            </div>
            {fieldType === "select" && (
              <div className="space-y-2">
                <Label htmlFor="options">선택 옵션 (줄바꿈으로 구분)</Label>
                <textarea
                  id="options"
                  value={fieldOptions}
                  onChange={(e) => setFieldOptions(e.target.value)}
                  placeholder="옵션1&#10;옵션2&#10;옵션3"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="required">필수 입력</Label>
              <Switch
                id="required"
                checked={fieldRequired}
                onCheckedChange={setFieldRequired}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingField ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="필드 삭제"
        description={`"${deleteTarget?.label}" 필드를 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
