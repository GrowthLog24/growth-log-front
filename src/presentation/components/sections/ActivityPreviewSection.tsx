"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStorageUrl } from "@/shared/utils";
import type { Activity } from "@/domain/entities";

interface ActivityPreviewSectionProps {
  initialActivities: Activity[];
}

const ITEMS_PER_LOAD = 6;

/**
 * 썸네일 URL을 가져오는 헬퍼 함수
 */
function getThumbnailUrl(activity: Activity): string {
  if (activity.thumbnail.url) {
    return activity.thumbnail.url;
  }
  if (activity.thumbnail.storagePath) {
    return getStorageUrl(activity.thumbnail.storagePath);
  }
  return "/images/placeholder-activity.jpg";
}

export function ActivityPreviewSection({ initialActivities }: ActivityPreviewSectionProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities.slice(0, ITEMS_PER_LOAD));
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialActivities.length > ITEMS_PER_LOAD);

  const loadMore = async () => {
    setIsLoading(true);

    // 현재 로드된 수 기준으로 다음 아이템들 가져오기
    const nextItems = initialActivities.slice(
      activities.length,
      activities.length + ITEMS_PER_LOAD
    );

    // 약간의 딜레이로 UX 개선
    await new Promise((resolve) => setTimeout(resolve, 300));

    setActivities((prev) => [...prev, ...nextItems]);
    setHasMore(activities.length + nextItems.length < initialActivities.length);
    setIsLoading(false);
  };

  return (
    <section className="section-padding bg-gray-6">
      <div className="container-custom">
        {/* Section Header */}
        <div className="mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            COMMUNITY BLOG
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            그로스로그 활동
          </h2>
        </div>

        {/* Activity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => {
            const hasExternalUrl = !!activity.externalUrl;
            const CardWrapper = hasExternalUrl ? ExternalLinkCard : InternalLinkCard;

            return (
              <CardWrapper
                key={activity.id}
                activity={activity}
                thumbnailUrl={getThumbnailUrl(activity)}
              />
            );
          })}
        </div>

        {/* 활동이 없을 때 */}
        {activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              아직 등록된 활동이 없습니다.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={loadMore}
              disabled={isLoading}
              className="min-w-[160px]"
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
      </div>
    </section>
  );
}

/**
 * 외부 링크 카드 컴포넌트
 */
function ExternalLinkCard({
  activity,
  thumbnailUrl,
}: {
  activity: Activity;
  thumbnailUrl: string;
}) {
  return (
    <a
      href={activity.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <ActivityCard
        activity={activity}
        thumbnailUrl={thumbnailUrl}
        showExternalIcon
      />
    </a>
  );
}

/**
 * 내부 링크 카드 컴포넌트 (외부 URL이 없을 때 fallback)
 */
function InternalLinkCard({
  activity,
  thumbnailUrl,
}: {
  activity: Activity;
  thumbnailUrl: string;
}) {
  return (
    <Link href={`/activity/${activity.id}`} className="group">
      <ActivityCard activity={activity} thumbnailUrl={thumbnailUrl} />
    </Link>
  );
}

/**
 * 활동 카드 UI 컴포넌트
 */
function ActivityCard({
  activity,
  thumbnailUrl,
  showExternalIcon = false,
}: {
  activity: Activity;
  thumbnailUrl: string;
  showExternalIcon?: boolean;
}) {
  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-gray-4 overflow-hidden">
        <Image
          src={thumbnailUrl}
          alt={activity.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-foreground">
            {activity.category}
          </Badge>
        </div>
        {/* External Link Indicator */}
        {showExternalIcon && (
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {activity.title}
        </h3>
        <div className="flex flex-wrap gap-2 mt-3">
          {activity.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-muted-foreground bg-gray-5 px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
