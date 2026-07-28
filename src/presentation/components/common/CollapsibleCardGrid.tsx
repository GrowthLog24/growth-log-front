"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/shared/utils/analytics";

/** 접힘 상태에서 DOM에 올리는 최대 개수 (xl 4열 기준 2줄) */
const COLLAPSED_MAX = 8;

/** 버튼을 노출할 최소 개수 (모바일 1열 기준 2줄) */
const COLLAPSED_MIN = 2;

/**
 * 접힘 상태에서 "정확히 2줄"만 보이게 하는 인덱스별 반응형 클래스.
 *
 * 그리드가 1 / 2 / 3 / 4열로 바뀌므로 2줄에 해당하는 개수도 2 / 4 / 6 / 8로 달라집니다.
 * 브레이크포인트별 노출 개수를 CSS로 처리해 하이드레이션 불일치 없이 동작합니다.
 *
 * 보일 때 `contents`를 쓰는 이유: 래퍼가 그리드 아이템이 되면 카드의 높이 정렬이 달라집니다.
 * (카드 루트가 `h-full`에 의존하거나 `<article>`/`<a>`로 제각각이라 래퍼를 레이아웃에서 제거)
 */
function collapsedVisibilityClass(index: number): string {
  if (index < 2) return "contents";
  if (index < 4) return "hidden sm:contents";
  if (index < 6) return "hidden lg:contents";
  return "hidden xl:contents";
}

interface CollapsibleCardGridProps<T> {
  /** 전체 아이템 */
  items: readonly T[];
  /** React key 추출 */
  getKey: (item: T) => string;
  /** 카드 렌더러 */
  renderItem: (item: T) => ReactNode;
  /** 애널리틱스 list_expand 이벤트의 list_type */
  listType: string;
}

/**
 * 기본 2줄만 보여주고 "더 보기"로 전체를 펼치는 카드 그리드.
 *
 * @example
 * <CollapsibleCardGrid
 *   items={projects}
 *   getKey={(p) => p.id}
 *   renderItem={(p) => <ProjectCard project={p} />}
 *   listType="projects"
 * />
 */
export function CollapsibleCardGrid<T>({
  items,
  getKey,
  renderItem,
  listType,
}: CollapsibleCardGridProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleItems = isExpanded ? items : items.slice(0, COLLAPSED_MAX);
  const canToggle = items.length > COLLAPSED_MIN;

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);

    if (next) {
      trackEvent("list_expand", {
        list_type: listType,
        items_loaded: items.length - COLLAPSED_MAX,
        visible_items: items.length,
      });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleItems.map((item, index) => (
          <div
            key={getKey(item)}
            className={isExpanded ? "contents" : collapsedVisibilityClass(index)}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>

      {canToggle && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={handleToggle}
            className="min-w-[140px]"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                접기
                <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                더 보기
                <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
