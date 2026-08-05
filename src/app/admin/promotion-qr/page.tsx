"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  QrCode,
  Download,
  Search,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/presentation/components/admin";
import { promotionLinkAdminRepository } from "@/infrastructure/repositories/admin/promotionLinkAdminRepository";
import {
  buildPromotionLinkUrl,
  getPromotionLinkBaseUrl,
  normalizeKeyword,
  validateKeyword,
  validateTargetUrl,
} from "@/shared/utils/promotionLink";
import {
  createQrPngDataUrl,
  downloadQrPng,
  downloadQrSvg,
} from "@/shared/utils/qrCode";
import type { PromotionLink } from "@/domain/entities";

/** 등록/수정 폼 초기값 */
const EMPTY_FORM = {
  name: "",
  keyword: "",
  note: "",
  targetUrl: "",
  isActive: true,
};

/**
 * 홍보물 QR 발급 페이지
 *
 * 발급된 QR은 `{사이트 주소}/links/{키워드}`를 가리키고, 해당 경로는
 * 등록된 이동 주소로 리디렉트됩니다. 인쇄된 QR을 그대로 두고도
 * 이동 주소만 바꿀 수 있습니다.
 */
export default function PromotionQrPage() {
  const [items, setItems] = useState<PromotionLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 등록/수정 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PromotionLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // QR 다이얼로그 상태
  const [qrItem, setQrItem] = useState<PromotionLink | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<PromotionLink | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 기준 주소는 브라우저에서만 확정되므로 마운트 이후에 읽습니다.
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(getPromotionLinkBaseUrl());
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      setItems(await promotionLinkAdminRepository.getAll());
    } catch (error) {
      console.error("Failed to fetch promotion links:", error);
      toast.error("목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLinkUrl = (keyword: string) =>
    buildPromotionLinkUrl(keyword, baseUrl || undefined);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (item: PromotionLink) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      keyword: item.keyword,
      note: item.note,
      targetUrl: item.targetUrl,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("QR 코드 이름을 입력해주세요.");
      return;
    }

    const keyword = normalizeKeyword(form.keyword);
    const keywordError = validateKeyword(keyword);
    if (keywordError) {
      toast.error(keywordError);
      return;
    }

    const targetUrl = form.targetUrl.trim();
    const targetUrlError = validateTargetUrl(targetUrl);
    if (targetUrlError) {
      toast.error(targetUrlError);
      return;
    }

    setSaving(true);
    try {
      const taken = await promotionLinkAdminRepository.isKeywordTaken(
        keyword,
        editingItem?.id
      );
      if (taken) {
        toast.error("이미 사용 중인 키워드입니다.");
        return;
      }

      const payload = {
        name,
        keyword,
        note: form.note.trim(),
        targetUrl,
        isActive: form.isActive,
      };

      if (editingItem) {
        await promotionLinkAdminRepository.update(editingItem.id, payload);
        toast.success("수정되었습니다.");
      } else {
        await promotionLinkAdminRepository.create(payload);
        toast.success("QR이 발급되었습니다.");
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save promotion link:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: PromotionLink, isActive: boolean) => {
    // 목록을 먼저 바꿔 토글이 즉시 반응하게 하고, 실패하면 되돌립니다.
    setItems((prev) =>
      prev.map((prevItem) =>
        prevItem.id === item.id ? { ...prevItem, isActive } : prevItem
      )
    );
    try {
      await promotionLinkAdminRepository.toggleActive(item.id, isActive);
    } catch (error) {
      console.error("Failed to toggle promotion link:", error);
      toast.error("상태 변경에 실패했습니다.");
      setItems((prev) =>
        prev.map((prevItem) =>
          prevItem.id === item.id
            ? { ...prevItem, isActive: item.isActive }
            : prevItem
        )
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await promotionLinkAdminRepository.delete(deleteTarget.id);
      toast.success("삭제되었습니다.");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete promotion link:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const openQrDialog = async (item: PromotionLink) => {
    setQrItem(item);
    setQrDataUrl("");
    try {
      setQrDataUrl(await createQrPngDataUrl(getLinkUrl(item.keyword)));
    } catch (error) {
      console.error("Failed to create QR code:", error);
      toast.error("QR 코드를 만드는데 실패했습니다.");
    }
  };

  const handleDownload = async (format: "png" | "svg") => {
    if (!qrItem) return;
    setDownloading(true);
    try {
      const url = getLinkUrl(qrItem.keyword);
      const fileName = `qr-${qrItem.keyword}`;
      if (format === "png") {
        await downloadQrPng(url, fileName);
      } else {
        await downloadQrSvg(url, fileName);
      }
    } catch (error) {
      console.error("Failed to download QR code:", error);
      toast.error("다운로드에 실패했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async (keyword: string) => {
    try {
      await navigator.clipboard.writeText(getLinkUrl(keyword));
      toast.success("주소가 복사되었습니다.");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("복사에 실패했습니다.");
    }
  };

  const filteredItems = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.keyword.includes(keyword) ||
        item.note.toLowerCase().includes(keyword) ||
        item.targetUrl.toLowerCase().includes(keyword)
    );
  }, [items, searchQuery]);

  // 입력 중에도 실제 발급될 주소를 그대로 보여줍니다.
  const previewKeyword = normalizeKeyword(form.keyword);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          총 {items.length}개의 QR · 포스터·현수막 등 홍보물에 넣을 QR을
          발급합니다. 인쇄 후에도 이동 주소를 바꿀 수 있습니다.
        </p>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          QR 발급
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름, 키워드, 노트, 주소로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 목록 */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "검색 결과가 없습니다." : "발급된 QR이 없습니다."}
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 p-4 hover:bg-gray-6 transition-colors md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.name}</p>
                  <Badge variant={item.isActive ? "default" : "outline"}>
                    {item.isActive ? "활성" : "비활성"}
                  </Badge>
                  <Badge variant="secondary">스캔 {item.scanCount ?? 0}회</Badge>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="truncate">{getLinkUrl(item.keyword)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleCopy(item.keyword)}
                    title="QR 주소 복사"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <a
                  href={item.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors"
                >
                  <span className="truncate">→ {item.targetUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>

                {item.note && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {item.note}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={item.isActive}
                  onCheckedChange={(checked) =>
                    handleToggleActive(item, checked)
                  }
                  title="활성 여부"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openQrDialog(item)}
                  title="QR 코드"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(item)}
                  title="수정"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(item)}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "QR 수정" : "QR 발급"}</DialogTitle>
            <DialogDescription>
              키워드는 QR 주소에 사용되므로, 발급 후 바꾸면 이미 인쇄된 QR은
              동작하지 않습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">QR 코드 이름 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="2026 봄 모집 포스터"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyword">키워드 *</Label>
              <Input
                id="keyword"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                placeholder="spring-poster"
              />
              <p className="text-xs text-muted-foreground break-all">
                QR 주소:{" "}
                <span className="font-medium text-gray-black">
                  {getLinkUrl(previewKeyword || "{키워드}")}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">이동할 주소 *</Label>
              <Input
                id="targetUrl"
                value={form.targetUrl}
                onChange={(e) =>
                  setForm({ ...form, targetUrl: e.target.value })
                }
                placeholder="https://www.growthlog.org/recruit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">노트</Label>
              <Textarea
                id="note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="어느 홍보물에 사용했는지 기록해두세요. (예: 3월 학교 게시판 A2 포스터 30장)"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isActive: checked })
                }
              />
              <Label htmlFor="isActive">활성화</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? "수정" : "발급"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR 코드 다이얼로그 */}
      <Dialog
        open={!!qrItem}
        onOpenChange={(open) => !open && setQrItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{qrItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`${qrItem?.name} QR 코드`}
                className="w-64 h-64 rounded-lg border"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {qrItem && (
              <a
                href={getLinkUrl(qrItem.keyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground text-center break-all underline underline-offset-2 hover:text-primary transition-colors"
              >
                {getLinkUrl(qrItem.keyword)}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}

            {qrItem && !qrItem.isActive && (
              <p className="text-xs text-destructive">
                비활성 상태입니다. 지금 스캔하면 페이지를 찾을 수 없습니다.
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              onClick={() => handleDownload("svg")}
              disabled={downloading}
            >
              <Download className="mr-2 h-4 w-4" />
              SVG
            </Button>
            <Button onClick={() => handleDownload("png")} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="QR 삭제"
        description={`"${deleteTarget?.name}"을(를) 삭제하면 이미 인쇄된 QR도 동작하지 않습니다. 삭제할까요?`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
