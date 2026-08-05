import { cn } from "@/lib/utils";
import type { QrDailyPoint } from "@/application/services/promotionQrAnalytics";

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
  /** 오래된 날짜부터 정렬된 일별 스캔 수 */
  data: readonly QrDailyPoint[];
  className?: string;
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
  if (total > 1 && index <= total * 0.12) return "left-0";
  if (total > 1 && index >= total * 0.88) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

/**
 * 일별 QR 스캔 추이 차트
 *
 * 단일 시리즈라 범례 없이 제목이 계열을 설명하고, 값은 마지막 지점에만
 * 직접 표기합니다. 나머지 값은 세로축 눈금과 hover 툴팁이 담당합니다.
 */
export function ScanTrendChart({ data, className }: ScanTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        표시할 데이터가 없습니다.
      </p>
    );
  }

  const maxCount = Math.max(...data.map((point) => point.count));
  const niceMax = toNiceMax(maxCount);

  const toX = (index: number) =>
    data.length === 1
      ? PADDING.left + PLOT_WIDTH / 2
      : PADDING.left + (index / (data.length - 1)) * PLOT_WIDTH;

  const toY = (count: number) =>
    PADDING.top + PLOT_HEIGHT - (count / niceMax) * PLOT_HEIGHT;

  const points = data.map((point, index) => ({
    ...point,
    x: toX(index),
    y: toY(point.count),
  }));

  const baseline = PADDING.top + PLOT_HEIGHT;
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x} ${baseline} L${points[0].x} ${baseline} Z`;

  const lastPoint = points[points.length - 1];

  // 가로축은 눈금 개수만큼만 라벨을 찍어 글자가 겹치지 않게 합니다.
  const xTickStep = Math.max(1, Math.round((data.length - 1) / (X_TICK_COUNT - 1)));

  return (
    <div
      className={cn(
        "relative w-full text-[var(--color-green-1)] dark:text-[var(--color-green-4)]",
        className
      )}
    >
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`최근 ${data.length}일 일별 QR 스캔 추이`}
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

        {/* 면적 → 선 → 끝점 순서로 겹쳐 그립니다. */}
        <path d={areaPath} fill="currentColor" fillOpacity={0.1} />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={4.5}
          fill="currentColor"
          className="stroke-white dark:stroke-gray-black"
          strokeWidth={2}
        />
        <text
          x={lastPoint.x}
          y={lastPoint.y - 14}
          textAnchor="middle"
          className="fill-foreground text-[11px] font-medium"
        >
          {lastPoint.count.toLocaleString()}
        </text>

        {/* 가로축 라벨: 마지막 날짜는 항상 찍고, 그 직전 눈금과 겹치면 건너뜁니다. */}
        {points.map((point, index) =>
          index === points.length - 1 ||
          (index % xTickStep === 0 &&
            points.length - 1 - index >= xTickStep * 0.5) ? (
            <text
              key={point.date}
              x={point.x}
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
        {data.map((point, index) => (
          <div key={point.date} className="group relative flex-1">
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-4 opacity-0 transition-opacity group-hover:opacity-100" />
            <div
              className={cn(
                "pointer-events-none absolute top-0 z-10 hidden whitespace-nowrap rounded-md bg-gray-black px-2 py-1 text-[11px] text-white shadow-sm group-hover:block",
                getTooltipAlignment(index, data.length)
              )}
            >
              <span className="text-gray-4">{point.label}</span>{" "}
              <span className="font-medium tabular-nums">
                {point.count.toLocaleString()}회
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
