"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  ExternalLink,
  Search,
  QrCode,
  Download,
  Check,
  X,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/presentation/components/admin";
import {
  memberAdminRepository,
  calculateMemberType,
} from "@/infrastructure/repositories/admin/memberAdminRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import type { Member } from "@/domain/entities";

const getSiteUrl = () =>
  typeof window !== "undefined" ? window.location.origin : "";

/**
 * 멤버 관리 페이지
 */
export default function MembersPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGeneration, setCurrentGeneration] = useState(0);

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    generation: "",
    memberName: "",
    isActive: true,
    redirectUrl: "",
  });

  // QR코드 상태
  const [qrItem, setQrItem] = useState<Member | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 엑셀 일괄 등록 상태
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<
    { memberName: string; generation: number; isActive: boolean; redirectUrl: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [members, siteConfig] = await Promise.all([
        memberAdminRepository.getAll(),
        siteConfigRepository.getSiteConfig(),
      ]);
      setItems(members);
      setCurrentGeneration(siteConfig?.currentGeneration ?? 0);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      toast.error("목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm({ generation: "", memberName: "", isActive: true, redirectUrl: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Member) => {
    setEditingItem(item);
    setForm({
      generation: String(item.generation),
      memberName: item.memberName,
      isActive: item.isActive,
      redirectUrl: item.redirectUrl || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.generation || !form.memberName) {
      toast.error("이름과 기수를 입력해주세요.");
      return;
    }

    const generation = Number(form.generation);
    const memberType = calculateMemberType(currentGeneration, generation);

    setSaving(true);
    try {
      if (editingItem) {
        await memberAdminRepository.update(editingItem.id, {
          generation,
          memberName: form.memberName,
          memberType,
          isActive: form.isActive,
          redirectUrl: form.redirectUrl || "",
        });
        toast.success("수정되었습니다.");
      } else {
        await memberAdminRepository.create({
          generation,
          memberName: form.memberName,
          memberType,
          isActive: form.isActive,
          redirectUrl: form.redirectUrl || undefined,
        });
        toast.success("추가되었습니다.");
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getMemberUrl = (item: Member) =>
    `${getSiteUrl()}/member/${item.generation}/${encodeURIComponent(item.memberName)}`;

  const openQrDialog = async (item: Member) => {
    setQrItem(item);
    const url = getMemberUrl(item);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
  };

  const downloadQr = () => {
    if (!qrItem || !qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${qrItem.generation}기-${qrItem.memberName}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await memberAdminRepository.delete(deleteTarget.id);
      toast.success("삭제되었습니다.");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // ===== 엑셀 일괄 등록 =====
  const downloadSampleExcel = () => {
    const sampleData = [
      { "멤버 이름": "홍길동", "가입 기수": 5, "가입 여부": "O", "리디렉트 URL": "https://github.com/honggildong" },
      { "멤버 이름": "김철수", "가입 기수": 5, "가입 여부": "O", "리디렉트 URL": "" },
      { "멤버 이름": "이영희", "가입 기수": 4, "가입 여부": "X", "리디렉트 URL": "" },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "멤버 목록");
    XLSX.writeFile(wb, "멤버_일괄등록_양식.xlsx");
  };

  const handleExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      const parsed = rows
        .map((row) => {
          const memberName = String(row["멤버 이름"] ?? "").trim();
          const generation = Number(row["가입 기수"]);
          const isActiveRaw = String(row["가입 여부"] ?? "O").trim().toUpperCase();
          const isActive = isActiveRaw !== "X";
          const redirectUrl = String(row["리디렉트 URL"] ?? "").trim();

          if (!memberName || isNaN(generation) || generation < 1) return null;
          return { memberName, generation, isActive, redirectUrl };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (parsed.length === 0) {
        toast.error("유효한 멤버 데이터가 없습니다. 엑셀 양식을 확인해주세요.");
        return;
      }

      setBulkPreview(parsed);
      setBulkDialogOpen(true);
    };
    reader.readAsArrayBuffer(file);

    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = "";
  };

  const handleBulkUpload = async () => {
    if (bulkPreview.length === 0) return;

    setBulkUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of bulkPreview) {
      try {
        const memberType = calculateMemberType(currentGeneration, row.generation);
        await memberAdminRepository.create({
          memberName: row.memberName,
          generation: row.generation,
          memberType,
          isActive: row.isActive,
          redirectUrl: row.redirectUrl || undefined,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to create member ${row.memberName}:`, error);
        failCount++;
      }
    }

    setBulkUploading(false);
    setBulkDialogOpen(false);
    setBulkPreview([]);

    if (failCount === 0) {
      toast.success(`${successCount}명의 멤버가 등록되었습니다.`);
    } else {
      toast.warning(`${successCount}명 등록 성공, ${failCount}명 등록 실패`);
    }
    fetchData();
  };

  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(item.generation).includes(searchQuery) ||
          item.memberType.includes(searchQuery)
      )
    : items;

  const previewMemberType =
    form.generation && currentGeneration
      ? calculateMemberType(currentGeneration, Number(form.generation))
      : null;

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
        <p className="text-sm text-muted-foreground">
          총 {items.length}명의 멤버 (현재 {currentGeneration}기)
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadSampleExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            양식 다운로드
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            엑셀 일괄 등록
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleExcelFile}
          />
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            멤버 추가
          </Button>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름, 기수, 회원구분으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 목록 */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "검색 결과가 없습니다." : "등록된 멤버가 없습니다."}
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 hover:bg-gray-6 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{item.generation}기</Badge>
                <Badge
                  variant={item.memberType === "신입회원" ? "default" : "outline"}
                >
                  {item.memberType}
                </Badge>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.memberName}</p>
                    {item.isActive ? (
                      <Check className="h-4 w-4 text-green-1" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  {item.redirectUrl && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {item.redirectUrl}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openQrDialog(item)}
                  title="QR코드"
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

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "멤버 수정" : "멤버 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberName">멤버 이름 *</Label>
              <Input
                id="memberName"
                value={form.memberName}
                onChange={(e) => setForm({ ...form, memberName: e.target.value })}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generation">가입 기수 *</Label>
              <Input
                id="generation"
                type="number"
                min={1}
                value={form.generation}
                onChange={(e) => setForm({ ...form, generation: e.target.value })}
                placeholder="5"
              />
              {previewMemberType && (
                <p className="text-xs text-muted-foreground">
                  회원 구분: <Badge variant="outline" className="text-xs ml-1">{previewMemberType}</Badge>
                  <span className="ml-2">
                    (현재 {currentGeneration}기 - 가입 {form.generation}기 = 차이 {currentGeneration - Number(form.generation)})
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="isActive">가입 여부</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirectUrl">리디렉트 URL</Label>
              <Input
                id="redirectUrl"
                value={form.redirectUrl}
                onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })}
                placeholder="https://github.com/username"
              />
              <p className="text-xs text-muted-foreground">
                /member/{form.generation || "기수"}/{form.memberName || "이름"} 접근 시 이 URL로 이동합니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR코드 다이얼로그 */}
      <Dialog open={!!qrItem} onOpenChange={(open) => !open && setQrItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {qrItem?.generation}기 {qrItem?.memberName} QR코드
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-64 h-64 rounded-lg border"
              />
            )}
            <p className="text-xs text-muted-foreground text-center break-all">
              {qrItem && getMemberUrl(qrItem)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrItem(null)}>
              닫기
            </Button>
            <Button onClick={downloadQr}>
              <Download className="mr-2 h-4 w-4" />
              PNG 다운로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 엑셀 일괄 등록 미리보기 다이얼로그 */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>엑셀 일괄 등록 미리보기</DialogTitle>
            <DialogDescription>
              총 {bulkPreview.length}명의 멤버를 등록합니다. 내용을 확인 후 등록해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-6 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">#</th>
                  <th className="text-left p-2 font-medium">이름</th>
                  <th className="text-left p-2 font-medium">기수</th>
                  <th className="text-left p-2 font-medium">회원 구분</th>
                  <th className="text-left p-2 font-medium">가입</th>
                  <th className="text-left p-2 font-medium">리디렉트 URL</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bulkPreview.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-6/50">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-medium">{row.memberName}</td>
                    <td className="p-2">{row.generation}기</td>
                    <td className="p-2">
                      <Badge
                        variant={
                          calculateMemberType(currentGeneration, row.generation) === "신입회원"
                            ? "default"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {calculateMemberType(currentGeneration, row.generation)}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {row.isActive ? (
                        <Check className="h-4 w-4 text-green-1" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    <td className="p-2 text-muted-foreground text-xs truncate max-w-[200px]">
                      {row.redirectUrl || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleBulkUpload} disabled={bulkUploading}>
              {bulkUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bulkUploading
                ? "등록 중..."
                : `${bulkPreview.length}명 일괄 등록`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="멤버 삭제"
        description={`${deleteTarget?.generation}기 ${deleteTarget?.memberName}을(를) 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
