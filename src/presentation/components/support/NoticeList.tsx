"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/shared/utils/date";
import type { Notice } from "@/domain/entities";
import type { SerializedFirestoreData } from "@/shared/utils/serialize";

interface NoticeListProps {
  notices: SerializedFirestoreData<Notice>[];
}

const ITEMS_PER_PAGE = 5;

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
      <div className="border rounded-lg divide-y">
        {notices.map((notice: any) => (
          <Link
            key={notice.id}
            href={`/support/notice/${notice.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-6 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {notice.isPinned && (
                <span className="shrink-0 px-2 py-0.5 bg-primary text-white text-xs rounded">
                  공지
                </span>
              )}
              <span className="text-foreground truncate">{notice.title}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {formatDate(notice.publishedAt)}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
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
