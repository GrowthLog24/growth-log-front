"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { siteConfigAdminRepository } from "@/infrastructure/repositories/admin/siteConfigAdminRepository";
import type { SiteConfig, CtaMode } from "@/domain/entities";

/**
 * CTA 버튼 설정 관리 페이지
 * 네비게이션과 히어로 섹션의 CTA 버튼 텍스트/링크를 설정
 */
export default function AdminCtaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Omit<SiteConfig, "updatedAt"> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configData = await siteConfigRepository.getSiteConfig();

        if (configData) {
          const { updatedAt, ...rest } = configData;
          setConfig(rest);
        } else {
          setConfig({
            currentGeneration: 1,
            navCtaText: "",
            navCtaLink: "",
            chatLink: "",
            isRecruitmentOpen: false,
            recruitmentGeneration: 1,
            recruitmentFormLink: "",
            ctaMode: "auto",
            primaryCtaText: "",
            primaryCtaLink: "",
            secondaryCtaText: "더 알아보기",
            secondaryCtaLink: "/about-us",
          });
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        toast.error("설정을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await siteConfigAdminRepository.updateSiteConfig(config);
      toast.success("CTA 설정이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = <K extends keyof Omit<SiteConfig, "updatedAt">>(
    key: K,
    value: Omit<SiteConfig, "updatedAt">[K]
  ) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const getAutoModePreview = () => {
    if (!config) return { primary: { text: "", link: "" }, secondary: { text: "", link: "" } };

    if (config.isRecruitmentOpen) {
      return {
        primary: {
          text: `${config.recruitmentGeneration}기 지원하기`,
          link: "/recruit",
        },
        secondary: {
          text: "더 알아보기",
          link: "/about-us",
        },
      };
    } else {
      const nextGeneration = (config.currentGeneration || 0) + 1;
      return {
        primary: {
          text: `${nextGeneration}기 사전 등록하기`,
          link: "/pre-register",
        },
        secondary: {
          text: "더 알아보기",
          link: "/about-us",
        },
      };
    }
  };

  const getCurrentPreview = () => {
    if (!config) return { primary: { text: "", link: "" }, secondary: { text: "", link: "" } };

    if (config.ctaMode === "manual") {
      return {
        primary: {
          text: config.primaryCtaText || "",
          link: config.primaryCtaLink || "",
        },
        secondary: {
          text: config.secondaryCtaText || "더 알아보기",
          link: config.secondaryCtaLink || "/about-us",
        },
      };
    }

    return getAutoModePreview();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">설정을 불러올 수 없습니다.</p>
      </div>
    );
  }

  const preview = getCurrentPreview();
  const autoPreview = getAutoModePreview();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* CTA 모드 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>CTA 버튼 모드</CardTitle>
          <CardDescription>
            네비게이션과 랜딩페이지의 CTA 버튼을 어떻게 표시할지 선택합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.ctaMode || "auto"}
            onValueChange={(value: CtaMode) => updateConfig("ctaMode", value)}
            className="space-y-4"
          >
            {/* 자동 모드 */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="auto" id="auto" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="auto" className="text-base font-medium cursor-pointer">
                  자동 모드 (모집 상태 기반)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  모집 상태에 따라 자동으로 버튼 텍스트가 변경됩니다.
                </p>
                <div className="mt-3 p-3 bg-muted rounded-md text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      모집 중
                    </span>
                    <span className="text-muted-foreground">
                      &quot;{config.recruitmentGeneration}기 지원하기&quot; → /recruit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      모집 종료
                    </span>
                    <span className="text-muted-foreground">
                      &quot;{(config.currentGeneration || 0) + 1}기 사전 등록하기&quot; → /pre-register
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 수동 모드 */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="manual" id="manual" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="manual" className="text-base font-medium cursor-pointer">
                  수동 모드
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  직접 버튼 텍스트와 링크를 설정합니다.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 수동 모드 설정 */}
      {config.ctaMode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle>버튼 설정</CardTitle>
            <CardDescription>
              CTA 버튼의 텍스트와 링크를 직접 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 메인 버튼 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">메인 버튼</h4>
              <p className="text-sm text-muted-foreground">
                네비게이션과 랜딩페이지에 표시되는 주요 CTA 버튼입니다.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryCtaText">버튼 텍스트</Label>
                  <Input
                    id="primaryCtaText"
                    value={config.primaryCtaText || ""}
                    onChange={(e) => updateConfig("primaryCtaText", e.target.value)}
                    placeholder="예: 6기 지원하기"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryCtaLink">링크</Label>
                  <Input
                    id="primaryCtaLink"
                    value={config.primaryCtaLink || ""}
                    onChange={(e) => updateConfig("primaryCtaLink", e.target.value)}
                    placeholder="예: /recruit 또는 https://..."
                  />
                </div>
              </div>
            </div>

            {/* 보조 버튼 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">보조 버튼 (랜딩페이지만)</h4>
              <p className="text-sm text-muted-foreground">
                랜딩페이지 히어로 섹션에 표시되는 두번째 버튼입니다.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="secondaryCtaText">버튼 텍스트</Label>
                  <Input
                    id="secondaryCtaText"
                    value={config.secondaryCtaText || ""}
                    onChange={(e) => updateConfig("secondaryCtaText", e.target.value)}
                    placeholder="예: 더 알아보기"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryCtaLink">링크</Label>
                  <Input
                    id="secondaryCtaLink"
                    value={config.secondaryCtaLink || ""}
                    onChange={(e) => updateConfig("secondaryCtaLink", e.target.value)}
                    placeholder="예: /about-us"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 현재 상태 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>현재 모집 상태</CardTitle>
          <CardDescription>
            자동 모드에서 참고하는 현재 설정값입니다. 변경은 &quot;사이트 정보 설정&quot;에서 할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">모집 상태:</span>
              {config.isRecruitmentOpen ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  모집 중
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  모집 종료
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">현재 기수:</span>
              <span className="font-medium">{config.currentGeneration}기</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">모집 대상 기수:</span>
              <span className="font-medium">{config.recruitmentGeneration}기</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex justify-between items-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              미리보기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>CTA 버튼 미리보기</DialogTitle>
              <DialogDescription>
                현재 설정으로 표시될 버튼 모습입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* 네비게이션 미리보기 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">네비게이션</h4>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Button size="sm" disabled={!preview.primary.text}>
                    {preview.primary.text || "(텍스트 없음)"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    → {preview.primary.link || "(링크 없음)"}
                  </span>
                </div>
              </div>

              {/* 히어로 섹션 미리보기 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">랜딩페이지 히어로</h4>
                <div className="p-4 bg-gray-900 rounded-lg space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={!preview.primary.text}>
                      {preview.primary.text || "(텍스트 없음)"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent text-white border-white hover:bg-white hover:text-gray-900"
                      disabled={!preview.secondary.text}
                    >
                      {preview.secondary.text || "(텍스트 없음)"}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>메인: → {preview.primary.link || "(링크 없음)"}</p>
                    <p>보조: → {preview.secondary.link || "(링크 없음)"}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              저장
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
