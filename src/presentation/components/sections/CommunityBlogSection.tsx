"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CommunityBlog } from "@/domain/entities";

interface CommunityBlogSectionProps {
  initialBlogs: CommunityBlog[];
}

const ITEMS_PER_LOAD = 6;

/**
 * 플랫폼별 라벨
 */
const PLATFORM_LABELS: Record<string, string> = {
  tistory: "Blog",
  instagram: "Instagram",
  youtube: "YouTube",
};

/**
 * 날짜 포맷 헬퍼
 */
function formatDate(timestamp: any): string {
  if (!timestamp) return "";

  // 1. Firebase Timestamp 객체인 경우 (toDate 메서드가 있는 경우)
  // 2. 숫자(milliseconds)나 문자열인 경우
  const date = typeof timestamp.toDate === 'function'
    ? timestamp.toDate()
    : new Date(timestamp);

  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function CommunityBlogSection({ initialBlogs }: CommunityBlogSectionProps) {
  const [blogs, setBlogs] = useState<CommunityBlog[]>(initialBlogs.slice(0, ITEMS_PER_LOAD));
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialBlogs.length > ITEMS_PER_LOAD);

  const loadMore = async () => {
    setIsLoading(true);

    const nextItems = initialBlogs.slice(
      blogs.length,
      blogs.length + ITEMS_PER_LOAD
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    setBlogs((prev) => [...prev, ...nextItems]);
    setHasMore(blogs.length + nextItems.length < initialBlogs.length);
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

        {/* Blog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>

        {/* 블로그가 없을 때 */}
        {blogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              아직 등록된 게시물이 없습니다.
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
 * 블로그 카드 컴포넌트
 */
function BlogCard({ blog }: { blog: CommunityBlog }) {
  return (
    <a
      href={blog.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <article className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] bg-gray-4 overflow-hidden">
          {blog.thumbnailUrl ? (
            <Image
              src={blog.thumbnailUrl}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-5">
              <span className="text-muted-foreground text-sm">No Image</span>
            </div>
          )}
          {/* Platform Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-foreground">
              {PLATFORM_LABELS[blog.platform] || blog.platform}
            </Badge>
          </div>
          {/* External Link Indicator */}
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {blog.title}
          </h3>
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <span>{blog.generation}기</span>
            <span>·</span>
            <span>{formatDate(blog.publishedAt)}</span>
          </div>
        </div>
      </article>
    </a>
  );
}
