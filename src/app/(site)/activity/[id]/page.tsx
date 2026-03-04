import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { activityRepository } from "@/infrastructure/repositories/activityRepository";
import { MarkdownContent } from "@/presentation/components/common";
import { formatDate } from "@/shared/utils/date";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const activity = await activityRepository.getActivityById(id);
  if (!activity) {
    return { title: "활동" };
  }
  return {
    title: activity.title,
    description: activity.summary,
  };
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const activity = await activityRepository.getActivityById(id);

  if (!activity) {
    notFound();
  }

  const thumbnailUrl = activity.thumbnail?.url || activity.thumbnail?.storagePath || "";

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
              {formatDate(activity.eventDateAt)}
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

          {activity.externalUrl && (
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <a
                  href={activity.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  외부 링크 보기
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Thumbnail */}
      {thumbnailUrl && (
        <section className="bg-gray-6 pb-8">
          <div className="container-custom">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-4">
              <Image
                src={thumbnailUrl}
                alt={activity.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      {activity.body?.contentMd && (
        <section className="section-padding bg-white">
          <div className="container-custom max-w-3xl">
            <MarkdownContent
              content={activity.body.contentMd}
              className="prose-lg"
            />
          </div>
        </section>
      )}
    </article>
  );
}
