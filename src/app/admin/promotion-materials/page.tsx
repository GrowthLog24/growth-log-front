"use client";

import { useState } from "react";
import {
  MaterialCarousel,
  NameBadgePanel,
} from "@/presentation/components/admin/promotion-material";
import {
  PROMOTION_MATERIALS,
  type PromotionMaterialId,
} from "@/shared/constants/promotionMaterials";

/**
 * 홍보물 일괄 제작 페이지
 *
 * 만들 홍보물을 캐러셀에서 고르면 그에 맞는 제작 화면이 아래에 열립니다.
 * 지금은 회원 명찰만 만들 수 있고, 명함은 준비 중입니다.
 *
 * @returns {React.ReactElement} 홍보물 제작 페이지
 */
export default function PromotionMaterialsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<PromotionMaterialId | null>(
    null
  );

  const selectedMaterial =
    PROMOTION_MATERIALS.find((material) => material.id === selectedId) ?? null;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        회원 정보로 인쇄용 홍보물을 한 번에 만듭니다. 만들 홍보물을 먼저
        고르세요.
      </p>

      <MaterialCarousel
        materials={PROMOTION_MATERIALS}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {selectedMaterial && (
        <section className="space-y-4 border-t pt-6">
          <div>
            <h2 className="text-lg font-semibold">{selectedMaterial.title}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedMaterial.description}
            </p>
          </div>

          {selectedMaterial.id === "name-badge" && <NameBadgePanel />}
        </section>
      )}
    </div>
  );
}
