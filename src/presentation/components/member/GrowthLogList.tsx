import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import type { GrowthLogSummaryDto } from "@/application/dtos/memberAchievement";
import { SectionHeading } from "./SectionHeading";

interface GrowthLogListProps {
  logs: readonly GrowthLogSummaryDto[];
}

/**
 * 회차 정보를 사람이 읽는 문구로 변환합니다.
 */
function formatRoundLabel(log: GrowthLogSummaryDto): string {
  if (log.round === null) return "회차 미지정";
  if (log.meetingDateMs === null) return `${log.round}회차`;

  const date = new Date(log.meetingDateMs);
  return `${log.round}회차 · ${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * 성장일지 제출 기록 섹션
 */
export function GrowthLogList({ logs }: GrowthLogListProps) {
  return (
    <section className="container-custom py-12">
      <SectionHeading
        eyebrow="GROWTH LOG"
        title="성장일지 기록"
        description={
          logs.length > 0
            ? `${logs.length}편의 성장일지를 제출했습니다.`
            : "아직 제출한 성장일지가 없습니다."
        }
      />

      {logs.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {logs.map((log) => (
            <li key={log.id}>
              <Link
                href={log.blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                {/* 썸네일 */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {log.thumbnailUrl ? (
                    <Image
                      src={log.thumbnailUrl}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <FileText className="h-7 w-7 text-muted-foreground/50" aria-hidden />
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {formatRoundLabel(log)}
                    </span>
                    {log.field && (
                      <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {log.field}
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
                    {log.title}
                  </p>

                  {log.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {log.excerpt}
                    </p>
                  )}

                  <span className="mt-auto flex items-center gap-1 pt-2 text-[11px] font-medium text-muted-foreground">
                    글 읽기
                    <ArrowUpRight
                      className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
