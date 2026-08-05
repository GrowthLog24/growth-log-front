import { cn } from "@/lib/utils";
import type {
  QrDailyPoint,
  QrSeries,
} from "@/application/services/promotionQrAnalytics";

/** 차트 좌표계 (뷰박스 기준, 화면 크기와 무관) */
const VIEW = { width: 720, height: 200 };

/** 축 라벨 자리를 뺀 실제 그래프 영역 여백 */
const PADDING = { top: 12, right: 16, bottom: 22, left: 36 };

const PLOT_WIDTH = VIEW.width - PADDING.left - PADDING.right;
const PLOT_HEIGHT = VIEW.height - PADDING.top - PADDING.bottom;

/** 가로축 눈금 개수 (양 끝 포함) */
const X_TICK_COUNT = 5;

/** 세로축 눈금 구간 수 */
const Y_DIVISIONS = 4;

interface ScanTrendChartProps {
  /** 오래된 날짜부터 정렬된 날짜 축 (합계 포함) */
  points: readonly QrDailyPoint[];
  /** QR별 선 (counts 길이는 points와 동일) */
  series: readonly QrSeries[];
  className?: string;
}

/**
 * 색상 슬롯을 CSS 변수로 바꿉니다.
 *
 * 슬롯 순서는 고정이며, 라이트/다크 값은 globals.css가 관리합니다.
 *
 * @param {number} colorSlot - 색상 슬롯 (0은 "기타")
 * @returns {string} CSS 색상 값
 */
function toSeriesColor(colorSlot: number): string {
  return `var(--series-${colorSlot})`;
}

/**
 * 세로축 최댓값을 사람이 읽기 좋은 숫자로 올립니다.
 *
 * 눈금이 1.3, 2.6 같은 값으로 찍히지 않도록 1/2/5 배수로 맞춥니다.
 *
 * @param {number} maxValue - 데이터 최댓값
 * @returns {number} Y_DIVISIONS로 나누어떨어지는 눈금 최댓값
 */
function toNiceMax(maxValue: number): number {
  if (maxValue <= Y_DIVISIONS) return Y_DIVISIONS;

  const rawStep = maxValue / Y_DIVISIONS;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceStep =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) *
    magnitude;

  return niceStep * Y_DIVISIONS;
}

/**
 * 툴팁이 차트 밖으로 나가지 않도록 가장자리에서는 정렬을 바꿉니다.
 *
 * @param {number} index - 데이터 인덱스
 * @param {number} total - 전체 개수
 * @returns {string} 툴팁 위치 클래스
 */
function getTooltipAlignment(index: number, total: number): string {
  if (total > 1 && index <= total * 0.2) return "left-0";
  if (total > 1 && index >= total * 0.8) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

/**
 * 일별 QR 스캔 추이 차트
 *
 * QR마다 다른 색의 선으로 그려 홍보물별 반응을 비교할 수 있게 합니다.
 * 색만으로 구분되지 않도록 범례를 항상 함께 두고, 날짜별 값은 hover
 * 툴팁이 담당합니다.
 */
export function ScanTrendChart({
  points,
  series,
  className,
}: ScanTrendChartProps) {
  if (points.length === 0 || series.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        아직 스캔 기록이 없습니다.
      </p>
    );
  }

  const maxCount = Math.max(
    ...series.flatMap((line) => line.counts),
    0
  );
  const niceMax = toNiceMax(maxCount);

  const toX = (index: number) =>
    points.length === 1
      ? PADDING.left + PLOT_WIDTH / 2
      : PADDING.left + (index / (points.length - 1)) * PLOT_WIDTH;

  const toY = (count: number) =>
    PADDING.top + PLOT_HEIGHT - (count / niceMax) * PLOT_HEIGHT;

  const toLinePath = (counts: readonly number[]) =>
    counts
      .map((count, index) => `${index === 0 ? "M" : "L"}${toX(index)} ${toY(count)}`)
      .join(" ");

  // 가로축은 눈금 개수만큼만 라벨을 찍어 글자가 겹치지 않게 합니다.
  const xTickStep = Math.max(
    1,
    Math.round((points.length - 1) / (X_TICK_COUNT - 1))
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* 범례: 색 이름이 아니라 QR 이름으로 계열을 식별합니다. */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((line) => (
          <li key={line.id} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: toSeriesColor(line.colorSlot) }}
            />
            <span className="max-w-40 truncate text-foreground">{line.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {line.total.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`QR별 일별 스캔 추이 (최근 ${points.length}일)`}
        >
          {/* 가로 그리드 + 세로축 눈금 */}
          {Array.from({ length: Y_DIVISIONS + 1 }, (_, index) => {
            const value = (niceMax / Y_DIVISIONS) * index;
            const y = toY(value);
            return (
              <g key={value}>
                <line
                  x1={PADDING.left}
                  x2={VIEW.width - PADDING.right}
                  y1={y}
                  y2={y}
                  className="stroke-gray-5"
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {value.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* QR별 선 + 마지막 지점 표시 */}
          {series.map((line) => {
            const lastIndex = line.counts.length - 1;
            return (
              <g key={line.id} style={{ color: toSeriesColor(line.colorSlot) }}>
                <path
                  d={toLinePath(line.counts)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={toX(lastIndex)}
                  cy={toY(line.counts[lastIndex])}
                  r={4}
                  fill="currentColor"
                  className="stroke-white dark:stroke-gray-black"
                  strokeWidth={2}
                />
              </g>
            );
          })}

          {/* 가로축 라벨: 마지막 날짜는 항상 찍고, 그 직전 눈금과 겹치면 건너뜁니다. */}
          {points.map((point, index) =>
            index === points.length - 1 ||
            (index % xTickStep === 0 &&
              points.length - 1 - index >= xTickStep * 0.5) ? (
              <text
                key={point.date}
                x={toX(index)}
                y={VIEW.height - 6}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === points.length - 1
                      ? "end"
                      : "middle"
                }
                className="fill-muted-foreground text-[11px]"
              >
                {point.label}
              </text>
            ) : null
          )}
        </svg>

        {/* hover 레이어: 그래프 영역과 같은 비율로 덮어 날짜별 툴팁을 띄웁니다. */}
        <div
          className="absolute flex"
          style={{
            left: `${(PADDING.left / VIEW.width) * 100}%`,
            right: `${(PADDING.right / VIEW.width) * 100}%`,
            top: `${(PADDING.top / VIEW.height) * 100}%`,
            bottom: `${(PADDING.bottom / VIEW.height) * 100}%`,
          }}
        >
          {points.map((point, index) => {
            const rows = series
              .map((line) => ({ line, count: line.counts[index] }))
              .filter((row) => row.count > 0);

            return (
              <div key={point.date} className="group relative flex-1">
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-4 opacity-0 transition-opacity group-hover:opacity-100" />
                <div
                  className={cn(
                    "pointer-events-none absolute top-0 z-10 hidden min-w-28 rounded-md bg-gray-black px-2 py-1.5 text-[11px] text-white shadow-sm group-hover:block",
                    getTooltipAlignment(index, points.length)
                  )}
                >
                  <p className="mb-1 text-gray-4">{point.label}</p>
                  {rows.length === 0 ? (
                    <p className="text-gray-3">스캔 없음</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {rows.map(({ line, count }) => (
                        <li
                          key={line.id}
                          className="flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: toSeriesColor(line.colorSlot),
                            }}
                          />
                          <span className="max-w-32 truncate">{line.name}</span>
                          <span className="ml-auto font-medium tabular-nums">
                            {count.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
