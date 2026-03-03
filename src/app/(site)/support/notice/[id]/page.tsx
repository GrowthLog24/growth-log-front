import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Mock data - Firebase 연동 후 실제 데이터로 교체
const mockNoticeDetail = {
  id: "1",
  title: "[안내] 5기 그로스로그 멤버를 모집합니다.",
  date: "2025/03/01",
  isPinned: true,
  contentMd: `
안녕하세요, 그로스로그입니다.

**그로스로그 5기 멤버를 모집합니다!**

## 모집 일정

- 모집 기간: 2025년 3월 1일 ~ 3월 31일
- OT 일정: 4월 5일, 12일, 19일 중 택 1

## 지원 방법

1. 홈페이지 지원 페이지에서 신청서 작성
2. OT 참석
3. 등록금 납부

## 활동 내용

- 스터디 및 프로젝트 참여
- 전문가 특강 참석
- 정기 모임 및 네트워킹

자세한 내용은 Recruit 페이지를 확인해주세요.

감사합니다.
  `,
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: mockNoticeDetail.title,
    description: `그로스로그 공지사항 - ${mockNoticeDetail.title}`,
  };
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 실제로는 Firebase에서 데이터를 가져옴
  const notice = mockNoticeDetail;

  if (!notice) {
    notFound();
  }

  return (
    <article className="min-h-screen">
      {/* Header */}
      <section className="section-padding bg-white pb-8">
        <div className="container-custom max-w-3xl">
          <Button asChild variant="ghost" className="mb-6 -ml-4">
            <Link href="/support" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </Link>
          </Button>

          {notice.isPinned && (
            <span className="inline-block px-2 py-0.5 bg-primary text-white text-xs rounded mb-4">
              공지
            </span>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {notice.title}
          </h1>

          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {notice.date}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-gray-6 pt-8">
        <div className="container-custom max-w-3xl">
          <div className="bg-white rounded-xl p-6 md:p-8">
            <div
              className="prose prose-lg max-w-none
                         [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3
                         [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-4
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-2
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol>li]:mb-2
                         [&>strong]:text-foreground"
              dangerouslySetInnerHTML={{
                __html: notice.contentMd
                  .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
                  .replace(/^- (.*$)/gm, "<li>$1</li>")
                  .replace(/\n\n/g, "</p><p>")
                  .replace(/^(?!<[hulo])/gm, "<p>")
                  .replace(/<p><\/p>/g, ""),
              }}
            />
          </div>
        </div>
      </section>
    </article>
  );
}
