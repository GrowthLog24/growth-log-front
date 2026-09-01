"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  PromotionMaterial,
  PromotionMaterialId,
} from "@/shared/constants/promotionMaterials";

interface MaterialCarouselProps {
  /** 캐러셀에 보여 줄 홍보물 목록 */
  materials: readonly PromotionMaterial[];
  /** 현재 화면에 보이는 홍보물 순번 */
  activeIndex: number;
  /** 순번 변경 요청 */
  onActiveIndexChange: (index: number) => void;
  /** 선택된 홍보물 (없으면 아직 고르지 않은 상태) */
  selectedId: PromotionMaterialId | null;
  /** 홍보물 선택 요청 */
  onSelect: (id: PromotionMaterialId) => void;
}

/**
 * 만들 홍보물을 고르는 캐러셀
 *
 * 한 번에 한 종류씩 크게 보여 주고, 좌우 버튼이나 아래 점으로 넘깁니다.
 *
 * @param {MaterialCarouselProps} props - 캐러셀 속성
 * @returns {React.ReactElement} 캐러셀 UI
 */
export function MaterialCarousel({
  materials,
  activeIndex,
  onActiveIndexChange,
  selectedId,
  onSelect,
}: MaterialCarouselProps) {
  const moveBy = (step: number) => {
    // 양 끝에서 반대편으로 이어지도록 순환시킵니다.
    const next = (activeIndex + step + materials.length) % materials.length;
    onActiveIndexChange(next);
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="relative">
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                isSelected={selectedId === material.id}
                onSelect={() => onSelect(material.id)}
              />
            ))}
          </div>
        </div>

        {materials.length > 1 && (
          <>
            <CarouselArrow direction="prev" onClick={() => moveBy(-1)} />
            <CarouselArrow direction="next" onClick={() => moveBy(1)} />
          </>
        )}
      </div>

      {materials.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {materials.map((material, index) => (
            <button
              key={material.id}
              type="button"
              aria-label={`${material.title} 보기`}
              aria-current={index === activeIndex}
              onClick={() => onActiveIndexChange(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === activeIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MaterialCardProps {
  material: PromotionMaterial;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * 캐러셀 안의 홍보물 카드 한 장
 *
 * @param {MaterialCardProps} props - 카드 속성
 * @returns {React.ReactElement} 카드 UI
 */
function MaterialCard({ material, isSelected, onSelect }: MaterialCardProps) {
  return (
    <div className="w-full shrink-0 px-1 pb-1">
      <div
        className={cn(
          "rounded-xl border bg-background p-4 transition-shadow",
          isSelected ? "border-primary shadow-md" : "border-border"
        )}
      >
        <div className="relative mx-auto flex aspect-[269/346] w-full max-w-[220px] items-center justify-center overflow-hidden rounded-lg border bg-gray-6">
          {material.previewImage ? (
            <Image
              src={material.previewImage}
              alt={`${material.title} 미리보기`}
              fill
              sizes="220px"
              className="object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs">미리보기 준비 중</span>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-semibold">{material.title}</h3>
            <Badge variant={material.isAvailable ? "secondary" : "outline"}>
              {material.specLabel}
            </Badge>
          </div>
          <p className="min-h-[40px] text-sm text-muted-foreground">
            {material.description}
          </p>
        </div>

        <Button
          className="mt-3 w-full"
          variant={isSelected ? "secondary" : "default"}
          disabled={!material.isAvailable}
          onClick={onSelect}
        >
          {!material.isAvailable
            ? "준비 중"
            : isSelected
              ? "선택됨"
              : "이 홍보물 만들기"}
        </Button>
      </div>
    </div>
  );
}

interface CarouselArrowProps {
  direction: "prev" | "next";
  onClick: () => void;
}

/**
 * 캐러셀 좌우 이동 버튼
 *
 * @param {CarouselArrowProps} props - 버튼 속성
 * @returns {React.ReactElement} 이동 버튼
 */
function CarouselArrow({ direction, onClick }: CarouselArrowProps) {
  const isPrev = direction === "prev";
  const Icon = isPrev ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={isPrev ? "이전 홍보물" : "다음 홍보물"}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-gray-6",
        isPrev ? "-left-4" : "-right-4"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
