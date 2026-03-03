import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Mock data - Firebase 연동 후 실제 데이터로 교체
const mockActivityDetail = {
  id: "p1",
  title: "커뮤니티 플랫폼 개발",
  category: "프로젝트",
  summary: "React + Firebase로 커뮤니티 플랫폼 구축",
  thumbnail: getStorageUrl(STORAGE_PATHS.activityThumb(2024, "p1")),
  tags: ["React", "Firebase", "TypeScript"],
  date: "2024.12.15",
  generation: 4,
  contentMd: `
## 프로젝트 개요

이 프로젝트는 그로스로그 4기 멤버들이 함께 진행한 커뮤니티 플랫폼 개발 프로젝트입니다.

### 기술 스택

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Deployment**: Vercel

### 주요 기능

1. 회원 가입 및 로그인
2. 게시글 작성 및 조회
3. 댓글 기능
4. 실시간 알림

### 팀원 소개

- 프론트엔드: 홍길동, 김철수
- 백엔드: 이영희
- 디자인: 박지민

### 회고

이번 프로젝트를 통해 팀원들과 협업하는 방법을 배웠고, Firebase를 활용한 빠른 프로토타이핑 경험을 쌓을 수 있었습니다.
  `,
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // 실제로는 Firebase에서 데이터를 가져옴
  return {
    title: mockActivityDetail.title,
    description: mockActivityDetail.summary,
  };
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 실제로는 Firebase에서 데이터를 가져옴
  const activity = mockActivityDetail;

  if (!activity) {
    notFound();
  }

  return (
    <article className="min-h-screen">
      {/* Header */}
      <section className="bg-gray-6 py-8">
        <div className="container-custom">
          <Button asChild variant="ghost" className="mb-6 -ml-4">
            <Link href="/activity" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </Link>
          </Button>

          <Badge variant="outline" className="mb-4">
            {activity.category}
          </Badge>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {activity.title}
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            {activity.summary}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {activity.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              {activity.generation}기
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {activity.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Thumbnail */}
      <section className="bg-gray-6 pb-8">
        <div className="container-custom">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-4">
            <Image
              src={activity.thumbnail}
              alt={activity.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <div className="prose prose-lg max-w-none">
            {/* Markdown 렌더링 - 실제로는 react-markdown 등 사용 */}
            <div
              className="[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4
                         [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
                         [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-4
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-2
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol>li]:mb-2"
              dangerouslySetInnerHTML={{
                __html: activity.contentMd
                  .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                  .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                  .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
                  .replace(/^- \*\*(.*?)\*\*: (.*$)/gm, "<li><strong>$1</strong>: $2</li>")
                  .replace(/^- (.*$)/gm, "<li>$1</li>")
                  .replace(/\n\n/g, "</p><p>")
                  .replace(/^(?!<[hul])/gm, "<p>")
                  .replace(/<p><\/p>/g, ""),
              }}
            />
          </div>
        </div>
      </section>
    </article>
  );
}
