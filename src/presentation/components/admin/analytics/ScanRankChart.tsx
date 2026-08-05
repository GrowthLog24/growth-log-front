import { cn } from "@/lib/utils";
import type { QrLinkRank } from "@/application/services/promotionQrAnalytics";

interface ScanRankChartProps {
  /** 스캔이 많은 순으로 정렬된 QR 목록 */
  items: readonly QrLinkRank[];
  /** 집계 기간 (일) - 값 설명 문구에 사용 */
  days: number;
  className?: string;
}

/**
 * QR별 스캔 순위 막대 차트
 *
 * 가장 많이 스캔된 QR을 기준으로 막대 길이를 잡아, 홍보물 간
 * 상대적인 효과를 한눈에 비교할 수 있게 합니다.
 */
export function ScanRankChart({ items, days, className }: ScanRankChartProps) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        발급된 QR이 없습니다.
      </p>
    );
  }

  const maxCount = Math.max(...items.map((item) => item.count));

  return (
    <ol className={cn("space-y-3", className)}>
      {items.map((item) => {
        // 스캔이 0인 QR도 목록에서 사라지지 않도록 최소 길이를 남깁니다.
        const ratio = maxCount === 0 ? 0 : item.count / maxCount;
        const width = item.count === 0 ? 0 : Math.max(ratio * 100, 2);

        return (
          <li key={item.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  /{item.keyword}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums">
                {item.count.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  회 · 누적 {item.totalCount.toLocaleString()}
                </span>
              </p>
            </div>

            <div
              className="h-2.5 w-full rounded-[4px] bg-gray-6"
              role="img"
              aria-label={`${item.name}: 최근 ${days}일 ${item.count}회 스캔`}
            >
              {/* 색은 추이 그래프의 선과 같은 QR을 가리킵니다. */}
              <div
                className="h-full rounded-r-[4px]"
                style={{
                  width: `${width}%`,
                  backgroundColor: `var(--series-${item.colorSlot})`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
