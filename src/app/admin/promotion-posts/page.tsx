"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CampaignDraftForm } from "@/presentation/components/admin/promotion/CampaignDraftForm";
import { LoginFlow } from "@/presentation/components/admin/promotion/LoginFlow";
import { PromotionBoardTable } from "@/presentation/components/admin/promotion/PromotionBoardTable";
import { PromotionMetricGrid } from "@/presentation/components/admin/promotion/PromotionMetricGrid";
import { usePromotionBoardData } from "@/presentation/hooks/usePromotionBoardData";
import type { PromotionBoard } from "@/domain/entities";

/**
 * 방송대 홍보 게시 관리 페이지.
 * 게시 대상 현황(Google Sheets 동기화), 게시글 초안 작성, Growth Log 연결 앱을 통한
 * 방송대 게시·수정 자동화 요청을 한 화면에서 처리합니다.
 */
export default function AdminPromotionPostsPage() {
  const [selectedBoards, setSelectedBoards] = useState<PromotionBoard[]>([]);
  const { snapshot, isRefreshing, error, refresh } = usePromotionBoardData();
  const showNotice = useCallback((message: string) => toast.info(message), []);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        방송대 학과·지역대학 게시판 홍보 현황을 확인하고 게시글 게시·수정 자동화를 요청합니다.
      </p>

      <PromotionMetricGrid boards={snapshot.boards} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.72fr)]">
        <CampaignDraftForm selectedBoards={selectedBoards} onNotice={showNotice} />
        <LoginFlow />
      </div>

      <PromotionBoardTable
        snapshot={snapshot}
        isRefreshing={isRefreshing}
        error={error}
        onRefresh={() => void refresh()}
        onSelectionChange={setSelectedBoards}
      />
    </div>
  );
}
