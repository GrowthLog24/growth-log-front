import Link from "next/link";
import { ArrowRight, QrCode, ScanLine, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QrAnalytics } from "@/application/services/promotionQrAnalytics";
import { ScanTrendChart } from "./ScanTrendChart";
import { ScanRankChart } from "./ScanRankChart";

interface QrAnalyticsSectionProps {
  analytics: QrAnalytics;
}

interface StatTileProps {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * 요약 수치 타일
 */
function StatTile({ label, value, description, icon }: StatTileProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * 직전 기간 대비 증감을 문장과 아이콘으로 보여줍니다.
 *
 * 색만으로 방향을 알리지 않도록 화살표 아이콘과 부호를 함께 씁니다.
 */
function DeltaBadge({ deltaRate }: { deltaRate: number | null }) {
  if (deltaRate === null) {
    return (
      <span className="text-xs text-muted-foreground">직전 기간 기록 없음</span>
    );
  }

  const isUp = deltaRate >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isUp ? "text-[var(--color-green-1)]" : "text-destructive"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {isUp ? "+" : ""}
      {deltaRate.toLocaleString()}%
      <span className="font-normal text-muted-foreground">직전 기간 대비</span>
    </span>
  );
}

/**
 * 대시보드 QR Analytics 섹션
 *
 * 요약 수치, 일별 추이, QR별 순위를 함께 보여줍니다.
 */
export function QrAnalyticsSection({ analytics }: QrAnalyticsSectionProps) {
  const {
    days,
    totalScans,
    rangeScans,
    deltaRate,
    activeLinks,
    totalLinks,
    daily,
    series,
    topLinks,
  } = analytics;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">QR Analytics</h3>
          <p className="text-sm text-muted-foreground">
            홍보물 QR 스캔 현황 (최근 {days}일)
          </p>
        </div>
        <Link
          href="/admin/promotion-qr"
          className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          QR 관리
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label={`최근 ${days}일 스캔`}
          value={rangeScans.toLocaleString()}
          description={`직전 ${days}일 ${analytics.previousRangeScans.toLocaleString()}회`}
          icon={<ScanLine className="h-4 w-4" />}
        />
        <StatTile
          label="누적 스캔"
          value={totalScans.toLocaleString()}
          description="발급 이후 전체 스캔 수"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatTile
          label="활성 QR"
          value={`${activeLinks.toLocaleString()} / ${totalLinks.toLocaleString()}`}
          description="스캔 시 이동하는 QR 수"
          icon={<QrCode className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  QR별 일별 스캔 추이
                </CardTitle>
                <CardDescription>최근 {days}일</CardDescription>
              </div>
              <DeltaBadge deltaRate={deltaRate} />
            </div>
          </CardHeader>
          <CardContent>
            <ScanTrendChart points={daily} series={series} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">QR별 스캔 순위</CardTitle>
            <CardDescription>최근 {days}일 기준 상위 {topLinks.length}개</CardDescription>
          </CardHeader>
          <CardContent>
            <ScanRankChart items={topLinks} days={days} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
