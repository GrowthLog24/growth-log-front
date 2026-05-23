"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseInfiniteScrollOptions<T> {
  /** 전체 데이터 배열 */
  items: T[];
  /** 한 번에 로드할 아이템 수 */
  itemsPerLoad?: number;
  /** IntersectionObserver rootMargin (기본: 100px) */
  rootMargin?: string;
  /** 로딩 딜레이 (ms, 기본: 300) - UX 향상을 위한 최소 로딩 시간 */
  loadDelay?: number;
}

interface UseInfiniteScrollReturn<T> {
  /** 현재 표시할 아이템 배열 */
  visibleItems: T[];
  /** 더 로드할 아이템이 있는지 여부 */
  hasMore: boolean;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 관찰 대상 element에 연결할 ref */
  observerRef: React.RefObject<HTMLDivElement | null>;
  /** 수동으로 더 로드하는 함수 (fallback용) */
  loadMore: () => void;
  /** 리스트 초기화 */
  reset: () => void;
}

/**
 * IntersectionObserver 기반 무한 스크롤 훅
 *
 * @example
 * ```tsx
 * const { visibleItems, hasMore, isLoading, observerRef } = useInfiniteScroll({
 *   items: allItems,
 *   itemsPerLoad: 8,
 * });
 *
 * return (
 *   <>
 *     {visibleItems.map(item => <Card key={item.id} {...item} />)}
 *     {hasMore && <div ref={observerRef}>{isLoading && <Spinner />}</div>}
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll<T>({
  items,
  itemsPerLoad = 8,
  rootMargin = "100px",
  loadDelay = 300,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [visibleCount, setVisibleCount] = useState(itemsPerLoad);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // UX 향상을 위한 최소 로딩 시간
    await new Promise((resolve) => setTimeout(resolve, loadDelay));

    setVisibleCount((prev) => Math.min(prev + itemsPerLoad, items.length));
    setIsLoading(false);
  }, [isLoading, hasMore, itemsPerLoad, items.length, loadDelay]);

  // items가 변경되면 초기화
  const reset = useCallback(() => {
    setVisibleCount(itemsPerLoad);
    setIsLoading(false);
  }, [itemsPerLoad]);

  // IntersectionObserver 설정
  useEffect(() => {
    const currentRef = observerRef.current;
    if (!currentRef || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { rootMargin }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore, rootMargin]);

  return {
    visibleItems,
    hasMore,
    isLoading,
    observerRef,
    loadMore,
    reset,
  };
}
