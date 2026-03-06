"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Activity,
  ActivityCategory,
  ProjectActivity,
  StudyActivity,
  GrowthLogActivity,
  LectureActivity,
  GrowthTalkActivity,
  ClubActivity,
} from "@/domain/entities";
import { ACTIVITY_CATEGORY_LABELS, isClickableActivity } from "@/domain/entities";
import { ACTIVITY_CATEGORY_SUBTITLES } from "@/shared/constants";

interface ActivityCategorySectionProps {
  category: ActivityCategory;
  activities: Activity[];
  isOdd: boolean;
}

const ITEMS_PER_LOAD = 4;

/**
 * 날짜를 포맷하는 헬퍼 함수
 */
function formatDate(timestamp: { toDate?: () => Date; seconds?: number } | Date | string): string {
  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (typeof timestamp === "object" && "seconds" in timestamp && timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === "object" && "toDate" in timestamp && timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    return "";
  }
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
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

  const title = ACTIVITY_CATEGORY_LABELS[category];
  const subtitle = ACTIVITY_CATEGORY_SUBTITLES[category];
  const isEmpty = allActivities.length === 0;

  return (
    <section className={`py-16 ${isOdd ? "bg-white" : "bg-gray-6"}`}>
      <div className="container-custom">
        {/* Category Header */}
        <div className="mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-3">
            {subtitle}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h2>
        </div>

        {/* Empty State */}
        {isEmpty && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              아직 등록된 {title}이 없습니다.
            </p>
          </div>
        )}

        {/* Activity Cards */}
        {!isEmpty && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-10 text-center">
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
 * 카테고리에 따라 다른 UI를 표시합니다.
 */
function ActivityCard({ activity }: { activity: Activity }) {
  const isClickable = isClickableActivity(activity);

  switch (activity.category) {
    case "project":
      return <ProjectCard activity={activity} />;
    case "study":
      return <StudyCard activity={activity} />;
    case "growth-log":
      return <GrowthLogCard activity={activity} />;
    case "lecture":
      return <LectureCard activity={activity} />;
    case "growth-talk":
      return <GrowthTalkCard activity={activity} />;
    case "club":
      return <ClubCard activity={activity} />;
    default:
      return null;
  }
}

/**
 * 프로젝트 카드 (클릭 시 PDF 다이얼로그)
 */
function ProjectCard({ activity }: { activity: ProjectActivity }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="group cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col">
          {/* Thumbnail */}
          <div className="relative aspect-[4/3] bg-gray-4 overflow-hidden">
            {activity.thumbnailUrl ? (
              <Image
                src={activity.thumbnailUrl}
                alt={activity.projectName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-5">
                <FileText className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
            {/* PDF Indicator */}
            <div className="absolute top-3 right-3">
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
            {/* Platform Badge */}
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-white/90 text-foreground">
                {activity.platform}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {activity.projectName}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {activity.description}
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground mt-auto">
              <span>{activity.generation}기</span>
              <span>·</span>
              <span>PM {activity.leaderName}</span>
            </div>
          </div>
        </article>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!max-w-[65vw] w-[65vw] h-[85vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-5 py-3 border-b shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-sm">
              {activity.projectName}
              <Badge variant="secondary">{activity.platform}</Badge>
              <span className="text-muted-foreground font-normal">{activity.generation}기 · PM {activity.leaderName}</span>
            </DialogTitle>
          </DialogHeader>
          <PdfViewer url={activity.pdfUrl} title={activity.projectName} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * 학사 스터디 카드 (클릭 불가)
 */
function StudyCard({ activity }: { activity: StudyActivity }) {
  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm opacity-95">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-gray-4 overflow-hidden">
        {activity.thumbnailUrl ? (
          <Image
            src={activity.thumbnailUrl}
            alt={activity.subjectName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <span className="text-4xl">📚</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-foreground line-clamp-1">
          {activity.subjectName}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {activity.semester}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{activity.generation}기</span>
          <span>·</span>
          <span>스터디장 {activity.leaderName}</span>
        </div>
      </div>
    </article>
  );
}

/**
 * 성장일지 카드 (클릭 가능 → 블로그 이동)
 */
function GrowthLogCard({ activity }: { activity: GrowthLogActivity }) {
  return (
    <a
      href={activity.blogUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] bg-gray-4 overflow-hidden">
          {activity.thumbnailUrl ? (
            <Image
              src={activity.thumbnailUrl}
              alt={activity.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
              <span className="text-4xl">📝</span>
            </div>
          )}
          {/* External Link Indicator */}
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          {/* Field Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-foreground">
              {activity.field}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {activity.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {activity.excerpt}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>{activity.generation}기</span>
            <span>·</span>
            <span>{activity.authorName}</span>
          </div>
        </div>
      </article>
    </a>
  );
}

/**
 * 전문가 특강 카드 (클릭 불가)
 */
function LectureCard({ activity }: { activity: LectureActivity }) {
  const dateStr = activity.lectureDate
    ? formatDate(activity.lectureDate)
    : "";

  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm opacity-95">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-gray-4 overflow-hidden">
        {activity.thumbnailUrl ? (
          <Image
            src={activity.thumbnailUrl}
            alt={activity.lectureName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
            <span className="text-4xl">🎤</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-foreground line-clamp-1">
          {activity.lectureName}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
          {activity.speakerOrganization} · {activity.speakerTitle}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{activity.generation}기</span>
          {dateStr && (
            <>
              <span>·</span>
              <span>{dateStr}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * 그로스톡 카드 (클릭 불가)
 */
function GrowthTalkCard({ activity }: { activity: GrowthTalkActivity }) {
  const dateStr = activity.eventDate
    ? formatDate(activity.eventDate)
    : "";

  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm opacity-95">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-gray-4 overflow-hidden">
        {activity.thumbnailUrl ? (
          <Image
            src={activity.thumbnailUrl}
            alt={activity.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
            <span className="text-4xl">💬</span>
          </div>
        )}
        {/* Field Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-foreground">
            {activity.field}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-foreground line-clamp-1">
          {activity.round ? `${activity.round}회 ` : ""}{activity.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          진행: {activity.hostName}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{activity.generation}기</span>
          {dateStr && (
            <>
              <span>·</span>
              <span>{dateStr}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * 클럽 활동 카드 (클릭 불가)
 */
function ClubCard({ activity }: { activity: ClubActivity }) {
  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm opacity-95">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-gray-4 overflow-hidden">
        {activity.thumbnailUrl ? (
          <Image
            src={activity.thumbnailUrl}
            alt={activity.clubName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-pink-100">
            <span className="text-4xl">🎯</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-foreground line-clamp-1">
          {activity.clubName}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {activity.description}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{activity.generation}기</span>
          <span>·</span>
          <span>클럽장 {activity.leaderName}</span>
        </div>
      </div>
    </article>
  );
}

/**
 * PDF 뷰어 (로딩 프로그레스바 포함)
 */
function PdfViewer({ url, title }: { url: string; title: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex-1 min-h-0 relative">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background z-10">
          <FileText className="w-10 h-10 text-primary/30" />
          <p className="text-sm text-muted-foreground">PDF 불러오는 중...</p>
          <div className="w-48 h-1.5 bg-gray-5 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-progress" />
          </div>
        </div>
      )}
      <iframe
        src={`${url}#toolbar=0&navpanes=0`}
        className="w-full h-full"
        title={title}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
