"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, getEventStatus, type EventStatus } from "@/shared/utils/date";
import { trackEvent } from "@/shared/utils/analytics";
import type { Notice } from "@/domain/entities";
import type { SerializedFirestoreData } from "@/shared/utils/serialize";

interface NoticeListProps {
  notices: SerializedFirestoreData<Notice>[];
}

const ITEMS_PER_PAGE = 5;

const ROW_GRID = "grid-cols-[1fr_20px] sm:grid-cols-[104px_88px_1fr_20px]";

const STATUS_CONFIG: Record<EventStatus, { label: string; className: string }> = {
  ongoing: { label: "진행중", className: "bg-primary/10 text-primary" },
  done: { label: "완료", className: "bg-gray-6 text-gray-2" },
  upcoming: { label: "예정", className: "bg-blue-50 text-blue-600" },
};

function StatusChip({ status }: { status: EventStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {status === "ongoing" && (
        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

/**
 * 공지사항 리스트 컴포넌트 (더보기 기능 포함)
 * 5개 이상일 때 "더 보기" 버튼으로 추가 로드
 */
export function NoticeList({ notices: allNotices }: NoticeListProps) {
  const [notices, setNotices] = useState<SerializedFirestoreData<Notice>[]>(
    allNotices.slice(0, ITEMS_PER_PAGE)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(allNotices.length > ITEMS_PER_PAGE);

  const loadMore = async () => {
    setIsLoading(true);

    const nextItems = allNotices.slice(
      notices.length,
      notices.length + ITEMS_PER_PAGE
    );

    // 부드러운 로딩 효과
    await new Promise((resolve) => setTimeout(resolve, 300));

    setNotices((prev) => [...prev, ...nextItems]);
    setHasMore(notices.length + nextItems.length < allNotices.length);
    trackEvent("list_expand", {
      list_type: "notices",
      items_loaded: nextItems.length,
      visible_items: notices.length + nextItems.length,
    });
    setIsLoading(false);
  };

  if (allNotices.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">등록된 공지사항이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* Notice List */}
      <div className="border rounded-lg overflow-hidden">
        {/* Column Header */}
        <div
          className={`hidden sm:grid ${ROW_GRID} items-center gap-4 px-4 py-2.5 bg-gray-6 text-xs font-medium text-gray-2`}
        >
          <span>행사날짜</span>
          <span>현황</span>
          <span>제목</span>
          <span aria-hidden="true" />
        </div>

        <div className="divide-y">
          {notices.map((notice) => {
            const eventDate = notice.eventDate ?? notice.publishedAt;
            const status = getEventStatus(eventDate);

            return (
              <Link
                key={notice.id}
                href={`/support/notice/${notice.id}`}
                className={`grid ${ROW_GRID} items-center gap-4 p-4 hover:bg-gray-6 transition-colors`}
              >
                <span className="hidden sm:block text-sm text-muted-foreground tabular-nums">
                  {formatDate(eventDate)}
                </span>
                <span className="hidden sm:block">
                  <StatusChip status={status} />
                </span>
                <div className="min-w-0">
                  <div className="flex sm:hidden items-center gap-2 mb-1.5">
                    <StatusChip status={status} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(eventDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {notice.isPinned && (
                      <span className="shrink-0 px-2 py-0.5 bg-primary text-white text-xs rounded">
                        공지
                      </span>
                    )}
                    <span className="text-foreground truncate">{notice.title}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground justify-self-end" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                불러오는 중...
              </>
            ) : (
              "더 보기"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
