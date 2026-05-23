"use client";

import Image from "next/image";
import { FileText, Loader2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useInfiniteScroll } from "@/shared/hooks";
import type { ProjectActivity } from "@/domain/entities";
import type { SerializedFirestoreData } from "@/shared/utils/serialize";

interface ProjectsSectionProps {
  projects: SerializedFirestoreData<ProjectActivity>[];
  /** 수상한 프로젝트 ID 목록 */
  awardedProjectIds: string[];
}

const ITEMS_PER_LOAD = 8;

/**
 * 프로젝트 목록 섹션 컴포넌트
 * 인피니티 스크롤로 프로젝트 카드 표시
 */
export function ProjectsSection({ projects, awardedProjectIds }: ProjectsSectionProps) {
  const { visibleItems, hasMore, isLoading, observerRef } = useInfiniteScroll({
    items: projects,
    itemsPerLoad: ITEMS_PER_LOAD,
  });

  // 수상 프로젝트 ID를 Set으로 변환 (빠른 조회)
  const awardedSet = new Set(awardedProjectIds);

  if (projects.length === 0) {
    return (
      <section className="py-16 bg-gray-6">
        <div className="container-custom">
          <div className="mb-10">
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-3">
              TEAM PROJECT
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              프로젝트
            </h2>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              아직 등록된 프로젝트가 없습니다.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-6">
      <div className="container-custom">
        {/* Section Header */}
        <div className="mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-3">
            TEAM PROJECT
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            프로젝트
          </h2>
          <p className="mt-2 text-muted-foreground">
            그로스로그 회원들이 함께 만든 프로젝트들
          </p>
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleItems.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isAwarded={awardedSet.has(project.id)}
            />
          ))}
        </div>

        {/* Infinite Scroll Observer */}
        {hasMore && (
          <div
            ref={observerRef}
            className="flex justify-center items-center py-8"
          >
            {isLoading && (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * 프로젝트 카드 컴포넌트
 */
function ProjectCard({
  project,
  isAwarded,
}: {
  project: SerializedFirestoreData<ProjectActivity>;
  isAwarded: boolean;
}) {
  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm opacity-95 h-full flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gray-4 overflow-hidden">
        {project.thumbnailUrl ? (
          <Image
            src={project.thumbnailUrl}
            alt={project.projectName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-5">
            <FileText className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Award Trophy - 좌상단 */}
        {isAwarded && (
          <div className="absolute top-2 left-2 z-10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Platform Badge - 수상 아이콘이 있으면 위치 조정 */}
        <div className={`absolute ${isAwarded ? "top-2 left-12" : "top-3 left-3"}`}>
          <Badge variant="secondary" className="bg-white/90 text-foreground">
            {project.platform}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-foreground line-clamp-1">
          {project.projectName}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {project.description}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground mt-auto">
          <span>{project.generation}기</span>
          <span>·</span>
          <span>PM {project.leaderName}</span>
        </div>
      </div>
    </article>
  );
}
