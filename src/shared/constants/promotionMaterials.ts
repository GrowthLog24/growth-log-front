/**
 * 일괄 제작할 수 있는 홍보물 종류
 */
export type PromotionMaterialId = "name-badge" | "business-card";

/**
 * 홍보물 제작 항목
 */
export interface PromotionMaterial {
  /** 홍보물 식별자 */
  id: PromotionMaterialId;
  /** 캐러셀에 보이는 이름 */
  title: string;
  /** 한 줄 설명 */
  description: string;
  /** 미리보기 이미지 경로 (준비 중인 홍보물은 없을 수 있습니다) */
  previewImage?: string;
  /** 인쇄 규격 안내 */
  specLabel: string;
  /** 지금 만들 수 있는지 여부 */
  isAvailable: boolean;
}

/**
 * 홍보물 목록
 *
 * 캐러셀에 보이는 순서 그대로입니다.
 */
export const PROMOTION_MATERIALS: readonly PromotionMaterial[] = [
  {
    id: "name-badge",
    title: "회원 명찰",
    description:
      "회원 이름과 직무, 개인 업적 페이지로 가는 QR을 넣어 만듭니다. A4 한 장에 2명씩 들어갑니다.",
    previewImage: "/admin/name-badge/preview.png",
    specLabel: "A4 · 2명/장",
    isAvailable: true,
  },
  {
    id: "business-card",
    title: "회원 명함",
    description: "준비 중입니다.",
    specLabel: "준비 중",
    isAvailable: false,
  },
];
