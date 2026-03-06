"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  ExternalLink,
  Eye,
  EyeOff,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { communityBlogAdminRepository } from "@/infrastructure/repositories/admin/communityBlogAdminRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { uploadFile, generateStoragePath } from "@/infrastructure/firebase";
import type { CommunityBlog, CommunityBlogPlatform } from "@/domain/entities";

const PLATFORM_OPTIONS: { value: CommunityBlogPlatform; label: string }[] = [
  { value: "tistory", label: "티스토리 블로그" },
  { value: "instagram", label: "인스타그램" },
  { value: "youtube", label: "유튜브" },
];

const PLATFORM_LABELS: Record<string, string> = {
  tistory: "Blog",
  instagram: "Instagram",
  youtube: "YouTube",
};

/**
 * 커뮤니티 블로그 관리 페이지
 */
export default function CommunityBlogsPage() {
  const [blogs, setBlogs] = useState<CommunityBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentGeneration, setCurrentGeneration] = useState(0);

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<CommunityBlog | null>(null);
  const [saving, setSaving] = useState(false);

  // 썸네일 파일 업로드 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState<{
    title: string;
    url: string;
    platform: CommunityBlogPlatform;
    thumbnailUrl: string;
    generation: number;
    publishedAt: Date | undefined;
  }>({
    title: "",
    url: "",
    platform: "tistory",
    thumbnailUrl: "",
    generation: 0,
    publishedAt: undefined,
  });

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<CommunityBlog | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const [blogsData, siteConfig] = await Promise.all([
        communityBlogAdminRepository.getAllBlogs(),
        siteConfigRepository.getSiteConfig(),
      ]);
      setBlogs(blogsData);
      if (siteConfig) {
        setCurrentGeneration(siteConfig.currentGeneration || 0);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 다이얼로그 열기 (추가)
  const handleAdd = () => {
    setEditingBlog(null);
    setFormData({
      title: "",
      url: "",
      platform: "tistory",
      thumbnailUrl: "",
      generation: currentGeneration,
      publishedAt: new Date(),
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setDialogOpen(true);
  };

  // 다이얼로그 열기 (수정)
  const handleEdit = (blog: CommunityBlog) => {
    setEditingBlog(blog);
    const publishedAt = blog.publishedAt;
    const date = publishedAt && typeof publishedAt.toDate === "function"
      ? publishedAt.toDate()
      : publishedAt instanceof Date
        ? publishedAt
        : new Date();
    setFormData({
      title: blog.title,
      url: blog.url,
      platform: blog.platform,
      thumbnailUrl: blog.thumbnailUrl,
      generation: blog.generation,
      publishedAt: date,
    });
    setThumbnailFile(null);
    setThumbnailPreview(blog.thumbnailUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setDialogOpen(true);
  };

  // 썸네일 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드할 수 있습니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기는 5MB 이하여야 합니다.");
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // 썸네일 제거 핸들러
  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setFormData({ ...formData, thumbnailUrl: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 저장
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!formData.url.trim()) {
      toast.error("URL을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      let thumbnailUrl = formData.thumbnailUrl.trim();

      // 새 파일이 업로드된 경우 Firebase Storage에 업로드
      if (thumbnailFile) {
        const storagePath = generateStoragePath("community-blogs", thumbnailFile.name);
        thumbnailUrl = await uploadFile(thumbnailFile, storagePath);
      }

      const data = {
        title: formData.title.trim(),
        url: formData.url.trim(),
        platform: formData.platform,
        thumbnailUrl,
        generation: formData.generation,
        publishedAt: formData.publishedAt ?? new Date(),
      };

      if (editingBlog) {
        await communityBlogAdminRepository.updateBlog(editingBlog.id, data);
        toast.success("게시물이 수정되었습니다.");
      } else {
        await communityBlogAdminRepository.addBlog(data);
        toast.success("게시물이 추가되었습니다.");
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

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await communityBlogAdminRepository.deleteBlog(deleteTarget.id);
      toast.success("게시물이 삭제되었습니다.");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 활성화 토글
  const handleToggleActive = async (blog: CommunityBlog) => {
    try {
      await communityBlogAdminRepository.toggleActive(blog.id, !blog.isActive);
      toast.success(blog.isActive ? "비공개로 변경되었습니다." : "공개로 변경되었습니다.");
      fetchData();
    } catch (error) {
      console.error("Failed to toggle active:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  // 날짜 포맷
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR");
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
        <div>
          <h1 className="text-2xl font-bold">커뮤니티 블로그</h1>
          <p className="text-muted-foreground">
            홈페이지에 표시될 블로그/SNS 게시물을 관리합니다.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          게시물 추가
        </Button>
      </div>

      {/* 게시물 목록 */}
      {blogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">등록된 게시물이 없습니다.</p>
            <Button onClick={handleAdd} variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              첫 게시물 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {blogs.map((blog) => (
            <Card key={blog.id} className={!blog.isActive ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* 썸네일 */}
                  <div className="w-24 h-16 bg-gray-5 rounded-lg overflow-hidden flex-shrink-0">
                    {blog.thumbnailUrl ? (
                      <img
                        src={blog.thumbnailUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">
                        {PLATFORM_LABELS[blog.platform]}
                      </Badge>
                      <Badge variant="outline">{blog.generation}기</Badge>
                      {!blog.isActive && (
                        <Badge variant="secondary" className="bg-gray-4">
                          비공개
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium truncate">{blog.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(blog.publishedAt)}
                    </p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(blog)}
                      title={blog.isActive ? "비공개로 변경" : "공개로 변경"}
                    >
                      {blog.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a href={blog.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(blog)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(blog)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBlog ? "게시물 수정" : "게시물 추가"}
            </DialogTitle>
            <DialogDescription>
              블로그, 인스타그램, 유튜브 게시물을 등록합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 플랫폼 */}
            <div className="space-y-2">
              <Label>플랫폼</Label>
              <Select
                value={formData.platform}
                onValueChange={(v) =>
                  setFormData({ ...formData, platform: v as CommunityBlogPlatform })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="게시물 제목"
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            {/* 썸네일 이미지 */}
            <div className="space-y-2">
              <Label>썸네일 이미지</Label>
              <div className="flex items-center gap-4">
                {thumbnailPreview ? (
                  <div className="relative group">
                    <Image
                      src={thumbnailPreview}
                      alt="썸네일 미리보기"
                      width={120}
                      height={80}
                      className="w-[120px] h-[80px] rounded-lg object-cover border"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="absolute -top-1 -right-1 p-1 bg-background border border-border rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-6"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="w-[120px] h-[80px] rounded-lg bg-gray-6 flex items-center justify-center border border-dashed">
                    <span className="text-xs text-muted-foreground">없음</span>
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    이미지 선택
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG (최대 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* 기수 */}
            <div className="space-y-2">
              <Label htmlFor="generation">기수</Label>
              <div className="relative w-24">
                <Input
                  id="generation"
                  type="number"
                  min={1}
                  value={formData.generation || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      generation: parseInt(e.target.value) || 0,
                    })
                  }
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  기
                </span>
              </div>
            </div>

            {/* 게시 날짜 */}
            <div className="space-y-2">
              <Label>게시 날짜</Label>
              <DatePicker
                value={formData.publishedAt}
                onChange={(date) =>
                  setFormData({ ...formData, publishedAt: date })
                }
                placeholder="날짜 선택"
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
              {editingBlog ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="게시물 삭제"
        description={`"${deleteTarget?.title}" 게시물을 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
