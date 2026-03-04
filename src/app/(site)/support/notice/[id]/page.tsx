import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { noticeRepository } from "@/infrastructure/repositories/noticeRepository";
import { MarkdownContent } from "@/presentation/components/common";
import { formatDate } from "@/shared/utils/date";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const notice = await noticeRepository.getNoticeById(id);
  if (!notice) {
    return { title: "공지사항" };
  }
  return {
    title: notice.title,
    description: `그로스로그 공지사항 - ${notice.title}`,
  };
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const notice = await noticeRepository.getNoticeById(id);

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
            {formatDate(notice.publishedAt)}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-gray-6 pt-8">
        <div className="container-custom max-w-3xl">
          <div className="bg-white rounded-xl p-6 md:p-8">
            <MarkdownContent
              content={notice.contentMd}
              className="prose-lg"
            />
          </div>
        </div>
      </section>
    </article>
  );
}
