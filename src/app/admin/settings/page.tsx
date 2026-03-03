"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfigRepository, statsRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { siteConfigAdminRepository } from "@/infrastructure/repositories/admin/siteConfigAdminRepository";
import { statsAdminRepository } from "@/infrastructure/repositories/admin/statsAdminRepository";
import type { SiteConfig, Stats } from "@/domain/entities";

/**
 * 사이트 정보 설정 관리 페이지
 */
export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Omit<SiteConfig, "updatedAt"> | null>(null);
  const [stats, setStats] = useState<Omit<Stats, "updatedAt"> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configData, statsData] = await Promise.all([
          siteConfigRepository.getSiteConfig(),
          statsRepository.getStats(),
        ]);

        if (configData) {
          const { updatedAt, ...rest } = configData;
          setConfig(rest);
        } else {
          setConfig({
            currentGeneration: 1,
            navCtaText: "모집 중",
            navCtaLink: "/recruit",
            chatLink: "",
            isRecruitmentOpen: false,
            recruitmentGeneration: 1,
            recruitmentFormLink: "",
          });
        }

        if (statsData) {
          const { updatedAt, ...rest } = statsData;
          setStats(rest);
        } else {
          setStats({
            operatingYears: 0,
            activeMembers: 0,
            projectsCount: 0,
            generationsCount: 0,
            totalMembers: 0,
            growthPostsCount: 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("설정을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!config || !stats) return;

    setSaving(true);
    try {
      await Promise.all([
        siteConfigAdminRepository.updateSiteConfig(config),
        statsAdminRepository.updateStats(stats),
      ]);
      toast.success("설정이 저장되었습니다.");
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

  const updateStats = <K extends keyof Omit<Stats, "updatedAt">>(
    key: K,
    value: number
  ) => {
    setStats((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">설정을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 채팅 링크 */}
      <Card>
        <CardHeader>
          <CardTitle>채팅 링크</CardTitle>
          <CardDescription>
            오픈채팅 또는 문의 링크를 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="chatLink">채팅 링크 URL</Label>
            <Input
              id="chatLink"
              value={config.chatLink}
              onChange={(e) => updateConfig("chatLink", e.target.value)}
              placeholder="예: https://open.kakao.com/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 연혁 - 하나의 카드로 통합 */}
      <Card>
        <CardHeader>
          <CardTitle>연혁</CardTitle>
          <CardDescription>
            홈페이지에 표시되는 연혁 수치를 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="operatingYears">운영 기간</Label>
            <div className="relative">
              <Input
                id="operatingYears"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={stats.operatingYears || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  updateStats("operatingYears", parseInt(value) || 0);
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                년
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activeMembers">현재 활동 회원</Label>
            <div className="relative">
              <Input
                id="activeMembers"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={stats.activeMembers || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  updateStats("activeMembers", parseInt(value) || 0);
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                명
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectsCount">프로젝트</Label>
            <div className="relative">
              <Input
                id="projectsCount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={stats.projectsCount || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  updateStats("projectsCount", parseInt(value) || 0);
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                개
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="generationsCount">누적 기수</Label>
            <div className="relative">
              <Input
                id="generationsCount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={stats.generationsCount || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  updateStats("generationsCount", parseInt(value) || 0);
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                기
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalMembers">누적 멤버</Label>
            <div className="relative">
              <Input
                id="totalMembers"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={stats.totalMembers || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  updateStats("totalMembers", parseInt(value) || 0);
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                명
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="growthPostsCount">성장일지 발행</Label>
            <div className="relative">
              <Input
                id="growthPostsCount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={stats.growthPostsCount || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  updateStats("growthPostsCount", parseInt(value) || 0);
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                +
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
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
