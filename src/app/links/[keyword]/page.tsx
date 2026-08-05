import { notFound, redirect } from "next/navigation";
import { promotionLinkRepository } from "@/infrastructure/repositories";
import { normalizeKeyword } from "@/shared/utils/promotionLink";

interface PageProps {
  params: Promise<{ keyword: string }>;
}

/**
 * 스캔 수는 매 요청마다 갱신되어야 하므로 정적 캐시를 사용하지 않습니다.
 */
export const dynamic = "force-dynamic";

/**
 * 홍보물 QR 리디렉트 페이지
 *
 * `/links/{keyword}` 로 들어온 요청을 관리자에서 등록한 목적지 주소로 보냅니다.
 * 링크가 없거나 비활성 상태면 404를 보여줍니다.
 */
export default async function PromotionLinkPage({ params }: PageProps) {
  const { keyword } = await params;
  const link = await promotionLinkRepository.getByKeyword(
    normalizeKeyword(decodeURIComponent(keyword))
  );

  if (!link || !link.isActive) {
    notFound();
  }

  // 통계 기록이 실패하더라도 방문자는 목적지로 이동해야 합니다.
  try {
    await promotionLinkRepository.increaseScanCount(link.id);
  } catch (error) {
    console.error("Failed to increase scan count:", error);
  }

  redirect(link.targetUrl);
}
