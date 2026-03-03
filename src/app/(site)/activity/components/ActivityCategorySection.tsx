"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStorageUrl } from "@/shared/utils";
import type { Activity } from "@/domain/entities";

interface ActivityCategorySectionProps {
  category: string;
  activities: Activity[];
  isOdd: boolean;
}

const ITEMS_PER_LOAD = 4;

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

/**
 * 날짜를 포맷하는 헬퍼 함수
 */
function formatDate(timestamp: { toDate: () => Date } | Date): string {
  const date = "toDate" in timestamp ? timestamp.toDate() : timestamp;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function ActivityCategorySection({
  category,
  activities: allActivities,
  isOdd,
}: ActivityCategorySectionProps) {
  const [activities, setActivities] = useState<Activity[]>(
    allActivities.slice(0, ITEMS_PER_LOAD)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(allActivities.length > ITEMS_PER_LOAD);

  const loadMore = async () => {
    setIsLoading(true);

    const nextItems = allActivities.slice(
      activities.length,
      activities.length + ITEMS_PER_LOAD
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    setActivities((prev) => [...prev, ...nextItems]);
    setHasMore(activities.length + nextItems.length < allActivities.length);
    setIsLoading(false);
  };

  return (
    <section className={`py-12 ${isOdd ? "bg-white" : "bg-gray-6"}`}>
      <div className="container-custom">
        {/* Category Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">{category}</h2>
        </div>

        {/* Activity Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              thumbnailUrl={getThumbnailUrl(activity)}
            />
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-8 text-center">
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
      </div>
    </section>
  );
}

/**
 * 활동 카드 컴포넌트
 */
function ActivityCard({
  activity,
  thumbnailUrl,
}: {
  activity: Activity;
  thumbnailUrl: string;
}) {
  const hasExternalUrl = !!activity.externalUrl;
  const dateStr = formatDate(activity.eventDateAt);

  const cardContent = (
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
        {/* External Link Indicator */}
        {hasExternalUrl && (
          <div className="absolute top-3 right-3">
            <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs text-muted-foreground">{dateStr}</span>
        <h3 className="mt-1 text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {activity.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {activity.summary}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {activity.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs text-muted-foreground bg-gray-5 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );

  if (hasExternalUrl) {
    return (
      <a
        href={activity.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link href={`/activity/${activity.id}`} className="group">
      {cardContent}
    </Link>
  );
}
