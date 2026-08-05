import type { PromotionLink, PromotionLinkScan } from "@/domain/entities";

/** 집계 기준 시간대 (스캔은 대부분 국내에서 일어납니다) */
const TIME_ZONE = "Asia/Seoul";

/** 기본 집계 기간 (일) */
const DEFAULT_DAYS = 30;

/** 순위 차트에 보여줄 QR 개수 */
const TOP_LINK_LIMIT = 5;

/** 하루 밀리초 */
const DAY_MS = 24 * 60 * 60 * 1000;

/** 일별 추이 한 점 */
export interface QrDailyPoint {
  /** 날짜 키 (yyyy-mm-dd) */
  date: string;
  /** 축에 표시할 짧은 라벨 (예: "8/5") */
  label: string;
  /** 해당 날짜의 스캔 수 */
  count: number;
}

/** QR별 스캔 순위 한 줄 */
export interface QrLinkRank {
  id: string;
  name: string;
  keyword: string;
  /** 집계 기간 내 스캔 수 */
  count: number;
  /** 누적 스캔 수 */
  totalCount: number;
}

/** 대시보드 QR 분석 데이터 */
export interface QrAnalytics {
  /** 집계 기간 (일) */
  days: number;
  /** 누적 스캔 수 (전체 기간) */
  totalScans: number;
  /** 집계 기간 내 스캔 수 */
  rangeScans: number;
  /** 직전 동일 기간의 스캔 수 */
  previousRangeScans: number;
  /** 직전 기간 대비 증감률 (%). 직전 기간이 0이면 null */
  deltaRate: number | null;
  /** 활성 QR 수 */
  activeLinks: number;
  /** 전체 QR 수 */
  totalLinks: number;
  /** 일별 추이 (오래된 날짜부터) */
  daily: QrDailyPoint[];
  /** 기간 내 스캔이 많은 QR 순위 */
  topLinks: QrLinkRank[];
}

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  month: "numeric",
  day: "numeric",
});

/**
 * 날짜를 집계 기준 시간대의 날짜 키(yyyy-mm-dd)로 변환합니다.
 *
 * @param {Date} date - 변환할 시각
 * @returns {string} 날짜 키
 */
function toDayKey(date: Date): string {
  return dayKeyFormatter.format(date);
}

/**
 * 날짜를 축 라벨(예: "8/5")로 변환합니다.
 *
 * @param {Date} date - 변환할 시각
 * @returns {string} 축 라벨
 */
function toDayLabel(date: Date): string {
  // ko-KR은 "8. 5."처럼 점을 붙여 반환하므로 축에 맞게 다듬습니다.
  return dayLabelFormatter.format(date).replace(/\s/g, "").replace(/\.$/, "").replace(".", "/");
}

/**
 * Firestore Timestamp를 Date로 변환합니다.
 *
 * serverTimestamp()로 기록한 직후 등 값이 아직 확정되지 않은 문서는 건너뜁니다.
 *
 * @param {PromotionLinkScan} scan - 스캔 기록
 * @returns {Date | null} 스캔 시각. 확정되지 않았으면 null
 */
function toScannedDate(scan: PromotionLinkScan): Date | null {
  try {
    return scan.scannedAt?.toDate?.() ?? null;
  } catch {
    return null;
  }
}

/**
 * 홍보물 QR 스캔 기록을 대시보드용 분석 데이터로 집계합니다.
 *
 * 스캔이 없는 날짜도 0으로 채워, 추이 그래프의 가로축 간격이
 * 실제 시간 간격과 어긋나지 않게 합니다.
 *
 * @param {readonly PromotionLink[]} links - 발급된 QR 목록
 * @param {readonly PromotionLinkScan[]} scans - 스캔 기록 (기간의 2배만큼 조회하면 증감률까지 계산됩니다)
 * @param {object} [options] - 집계 옵션
 * @param {number} [options.days] - 집계 기간 (기본 30일)
 * @param {Date} [options.now] - 기준 시각 (기본 현재 시각)
 * @returns {QrAnalytics} 집계 결과
 */
export function buildQrAnalytics(
  links: readonly PromotionLink[],
  scans: readonly PromotionLinkScan[],
  options: { days?: number; now?: Date } = {}
): QrAnalytics {
  const days = options.days ?? DEFAULT_DAYS;
  const now = options.now ?? new Date();

  // 최근 days일의 날짜 키를 미리 만들어 0으로 채웁니다.
  const countsByDay = new Map<string, number>();
  const daily: QrDailyPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(now.getTime() - offset * DAY_MS);
    const key = toDayKey(date);
    countsByDay.set(key, 0);
    daily.push({ date: key, label: toDayLabel(date), count: 0 });
  }

  const rangeStart = now.getTime() - days * DAY_MS;
  const previousRangeStart = rangeStart - days * DAY_MS;

  const countsByLinkId = new Map<string, number>();
  let rangeScans = 0;
  let previousRangeScans = 0;

  for (const scan of scans) {
    const scannedAt = toScannedDate(scan);
    if (!scannedAt) continue;

    const time = scannedAt.getTime();
    if (time < previousRangeStart) continue;

    if (time < rangeStart) {
      previousRangeScans++;
      continue;
    }

    rangeScans++;
    countsByLinkId.set(scan.linkId, (countsByLinkId.get(scan.linkId) ?? 0) + 1);

    const key = toDayKey(scannedAt);
    if (countsByDay.has(key)) {
      countsByDay.set(key, countsByDay.get(key)! + 1);
    }
  }

  for (const point of daily) {
    point.count = countsByDay.get(point.date) ?? 0;
  }

  const topLinks: QrLinkRank[] = links
    .map((link) => ({
      id: link.id,
      name: link.name,
      keyword: link.keyword,
      count: countsByLinkId.get(link.id) ?? 0,
      totalCount: link.scanCount ?? 0,
    }))
    // 기간 내 스캔이 같으면 누적이 많은 QR을 위로 올립니다.
    .sort((a, b) => b.count - a.count || b.totalCount - a.totalCount)
    .slice(0, TOP_LINK_LIMIT);

  let totalScans = 0;
  let activeLinks = 0;
  for (const link of links) {
    totalScans += link.scanCount ?? 0;
    if (link.isActive) activeLinks++;
  }

  return {
    days,
    totalScans,
    rangeScans,
    previousRangeScans,
    deltaRate:
      previousRangeScans === 0
        ? null
        : Math.round(
            ((rangeScans - previousRangeScans) / previousRangeScans) * 100
          ),
    activeLinks,
    totalLinks: links.length,
    daily,
    topLinks,
  };
}
