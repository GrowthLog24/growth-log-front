"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/presentation/components/admin";
import { eventAdminRepository } from "@/infrastructure/repositories/admin/eventAdminRepository";
import type { Event, EventTimeBlock, EventTimeBlockSubItem } from "@/domain/entities";

/**
 * 행사 타임테이블 관리 페이지
 */
export default function EventsAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // 행사 다이얼로그
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    isActive: true,
  });

  // 타임블록 편집
  const [editingEventForBlocks, setEditingEventForBlocks] = useState<Event | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<EventTimeBlock[]>([]);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<EventTimeBlock | null>(null);
  const [blockForm, setBlockForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const [subItems, setSubItems] = useState<EventTimeBlockSubItem[]>([]);

  // 삭제
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 펼침 상태
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventAdminRepository.getAll();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("행사 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ===== 행사 CRUD =====
  const openCreateEventDialog = () => {
    setEditingEvent(null);
    setEventForm({ name: "", date: "", startTime: "", endTime: "", isActive: true });
    setEventDialogOpen(true);
  };

  const openEditEventDialog = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      isActive: event.isActive,
    });
    setEventDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.name || !eventForm.date || !eventForm.startTime || !eventForm.endTime) {
      toast.error("필수 필드를 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      if (editingEvent) {
        await eventAdminRepository.update(editingEvent.id, {
          name: eventForm.name,
          date: eventForm.date,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime,
          isActive: eventForm.isActive,
        });
        toast.success("행사가 수정되었습니다.");
      } else {
        await eventAdminRepository.create({
          name: eventForm.name,
          date: eventForm.date,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime,
          isActive: eventForm.isActive,
          timeBlocks: [],
        });
        toast.success("행사가 추가되었습니다.");
      }
      setEventDialogOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Failed to save event:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventAdminRepository.delete(deleteTarget.id);
      toast.success("행사가 삭제되었습니다.");
      setDeleteTarget(null);
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (event: Event) => {
    try {
      await eventAdminRepository.update(event.id, { isActive: !event.isActive });
      toast.success(event.isActive ? "비활성화되었습니다." : "활성화되었습니다.");
      fetchEvents();
    } catch (error) {
      console.error("Failed to toggle active:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  // ===== 타임블록 관리 =====
  const openBlocksEditor = (event: Event) => {
    setEditingEventForBlocks(event);
    setTimeBlocks(event.timeBlocks || []);
    setExpandedEventId(expandedEventId === event.id ? null : event.id);
  };

  const openCreateBlockDialog = () => {
    setEditingBlock(null);
    setBlockForm({ title: "", description: "", startTime: "", endTime: "" });
    setSubItems([]);
    setBlockDialogOpen(true);
  };

  const openEditBlockDialog = (block: EventTimeBlock) => {
    setEditingBlock(block);
    setBlockForm({
      title: block.title,
      description: block.description || "",
      startTime: block.startTime,
      endTime: block.endTime,
    });
    setSubItems(block.subItems || []);
    setBlockDialogOpen(true);
  };

  const addSubItem = () => {
    setSubItems([...subItems, { title: "", description: "", startTime: "", endTime: "" }]);
  };

  const updateSubItem = (index: number, field: keyof EventTimeBlockSubItem, value: string) => {
    const updated = [...subItems];
    updated[index] = { ...updated[index], [field]: value };
    setSubItems(updated);
  };

  const removeSubItem = (index: number) => {
    setSubItems(subItems.filter((_, i) => i !== index));
  };

  const handleSaveBlock = async () => {
    if (!editingEventForBlocks) return;
    if (!blockForm.title || !blockForm.startTime || !blockForm.endTime) {
      toast.error("필수 필드를 입력해주세요.");
      return;
    }

    const validSubItems = subItems.filter((si) => si.title && si.startTime && si.endTime);

    let updatedBlocks: EventTimeBlock[];
    if (editingBlock) {
      updatedBlocks = timeBlocks.map((b) =>
        b.id === editingBlock.id
          ? {
              ...b,
              title: blockForm.title,
              description: blockForm.description || "",
              startTime: blockForm.startTime,
              endTime: blockForm.endTime,
              subItems: validSubItems,
            }
          : b
      );
    } else {
      const newBlock: EventTimeBlock = {
        id: crypto.randomUUID(),
        title: blockForm.title,
        description: blockForm.description || "",
        startTime: blockForm.startTime,
        endTime: blockForm.endTime,
        subItems: validSubItems,
        order: timeBlocks.length,
      };
      updatedBlocks = [...timeBlocks, newBlock];
    }

    try {
      await eventAdminRepository.update(editingEventForBlocks.id, {
        timeBlocks: updatedBlocks,
      });
      setTimeBlocks(updatedBlocks);
      setBlockDialogOpen(false);
      toast.success(editingBlock ? "타임블록이 수정되었습니다." : "타임블록이 추가되었습니다.");
      fetchEvents();
    } catch (error) {
      console.error("Failed to save time block:", error);
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!editingEventForBlocks) return;
    const updatedBlocks = timeBlocks
      .filter((b) => b.id !== blockId)
      .map((b, i) => ({ ...b, order: i }));

    try {
      await eventAdminRepository.update(editingEventForBlocks.id, {
        timeBlocks: updatedBlocks,
      });
      setTimeBlocks(updatedBlocks);
      toast.success("타임블록이 삭제되었습니다.");
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete time block:", error);
      toast.error("삭제에 실패했습니다.");
    }
  };

  const moveBlock = async (index: number, direction: "up" | "down") => {
    if (!editingEventForBlocks) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= timeBlocks.length) return;

    const updatedBlocks = [...timeBlocks];
    [updatedBlocks[index], updatedBlocks[newIndex]] = [updatedBlocks[newIndex], updatedBlocks[index]];
    const reordered = updatedBlocks.map((b, i) => ({ ...b, order: i }));

    try {
      await eventAdminRepository.update(editingEventForBlocks.id, { timeBlocks: reordered });
      setTimeBlocks(reordered);
      fetchEvents();
    } catch (error) {
      console.error("Failed to reorder:", error);
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
        <p className="text-sm text-muted-foreground">총 {events.length}개의 행사</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/event/timetable" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              행사 페이지
            </a>
          </Button>
          <Button onClick={openCreateEventDialog}>
            <Plus className="mr-2 h-4 w-4" />
            행사 추가
          </Button>
        </div>
      </div>

      {/* 행사 목록 */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          등록된 행사가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg overflow-hidden">
              {/* 행사 요약 */}
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => openBlocksEditor(event)}
                >
                  <Badge variant={event.isActive ? "default" : "secondary"}>
                    {event.isActive ? "활성" : "비활성"}
                  </Badge>
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.date} {event.startTime} - {event.endTime}
                      {event.timeBlocks?.length > 0 && (
                        <span className="ml-2">
                          ({event.timeBlocks.length}개 타임블록)
                        </span>
                      )}
                    </p>
                  </div>
                  {expandedEventId === event.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Switch
                    checked={event.isActive}
                    onCheckedChange={() => toggleActive(event)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditEventDialog(event)}
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(event)}
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* 타임블록 목록 (펼침) */}
              {expandedEventId === event.id && (
                <div className="border-t bg-gray-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">타임테이블 블록</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingEventForBlocks(event);
                        setTimeBlocks(event.timeBlocks || []);
                        openCreateBlockDialog();
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      블록 추가
                    </Button>
                  </div>

                  {(event.timeBlocks || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      등록된 타임블록이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(event.timeBlocks || [])
                        .sort((a, b) => a.order - b.order)
                        .map((block, index) => (
                          <div
                            key={block.id}
                            className="bg-white border rounded-md p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                    disabled={index === 0}
                                    onClick={() => {
                                      setEditingEventForBlocks(event);
                                      setTimeBlocks(event.timeBlocks || []);
                                      moveBlock(index, "up");
                                    }}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                    disabled={index === (event.timeBlocks || []).length - 1}
                                    onClick={() => {
                                      setEditingEventForBlocks(event);
                                      setTimeBlocks(event.timeBlocks || []);
                                      moveBlock(index, "down");
                                    }}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {block.startTime} - {block.endTime}
                                </Badge>
                                <span className="font-medium text-sm">{block.title}</span>
                                {block.subItems?.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {block.subItems.length}개 세부항목
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingEventForBlocks(event);
                                    setTimeBlocks(event.timeBlocks || []);
                                    openEditBlockDialog(block);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingEventForBlocks(event);
                                    setTimeBlocks(event.timeBlocks || []);
                                    handleDeleteBlock(block.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            {block.description && (
                              <p className="text-xs text-muted-foreground mt-1 ml-8">
                                {block.description}
                              </p>
                            )}
                            {block.subItems?.length > 0 && (
                              <div className="mt-2 ml-8 space-y-1">
                                {block.subItems.map((sub, si) => (
                                  <div
                                    key={si}
                                    className="text-xs text-muted-foreground flex items-center gap-2 border-l-2 border-dashed pl-2"
                                  >
                                    <span className="font-mono">
                                      {sub.startTime}-{sub.endTime}
                                    </span>
                                    <span>{sub.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 행사 추가/수정 다이얼로그 */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "행사 수정" : "행사 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">행사명 *</Label>
              <Input
                id="eventName"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                placeholder="5기 정기모임"
              />
            </div>
            <div className="space-y-2">
              <Label>날짜 *</Label>
              <DatePicker
                value={eventForm.date ? new Date(eventForm.date + "T00:00:00") : undefined}
                onChange={(date) =>
                  setEventForm({
                    ...eventForm,
                    date: date
                      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                      : "",
                  })
                }
                placeholder="날짜 선택"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventStartTime">시작 시간 *</Label>
                <Input
                  id="eventStartTime"
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventEndTime">종료 시간 *</Label>
                <Input
                  id="eventEndTime"
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="eventActive"
                checked={eventForm.isActive}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, isActive: checked })}
              />
              <Label htmlFor="eventActive">활성화 (공개 페이지에 표시)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveEvent} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEvent ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 타임블록 추가/수정 다이얼로그 */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? "타임블록 수정" : "타임블록 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input
                value={blockForm.title}
                onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                placeholder="신입회원 온보딩"
              />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea
                value={blockForm.description}
                onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
                placeholder="세부 설명 (선택)"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작 시간 *</Label>
                <Input
                  type="time"
                  value={blockForm.startTime}
                  onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>종료 시간 *</Label>
                <Input
                  type="time"
                  value={blockForm.endTime}
                  onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                />
              </div>
            </div>

            {/* 서브 아이템 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>세부 항목</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSubItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  추가
                </Button>
              </div>
              {subItems.map((sub, index) => (
                <div key={index} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      세부 항목 {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSubItem(index)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={sub.title}
                    onChange={(e) => updateSubItem(index, "title", e.target.value)}
                    placeholder="제목"
                  />
                  <Input
                    value={sub.description || ""}
                    onChange={(e) => updateSubItem(index, "description", e.target.value)}
                    placeholder="설명 (선택)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={sub.startTime}
                      onChange={(e) => updateSubItem(index, "startTime", e.target.value)}
                    />
                    <Input
                      type="time"
                      value={sub.endTime}
                      onChange={(e) => updateSubItem(index, "endTime", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveBlock} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBlock ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="행사 삭제"
        description={`"${deleteTarget?.name}" 행사를 삭제하시겠습니까? 타임테이블 데이터도 함께 삭제됩니다.`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteEvent}
      />
    </div>
  );
}
