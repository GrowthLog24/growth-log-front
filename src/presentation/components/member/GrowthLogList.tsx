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
    <section className="container-custom py-10 md:py-16">
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
        <ul className="border-t border-black/10" data-member-reveal>
          {logs.map((log, index) => (
            <li key={log.id} className="border-b border-black/10">
              <Link
                href={log.blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-[36px_1fr_auto] items-center gap-3 py-4 sm:grid-cols-[52px_88px_1fr_auto] sm:gap-5"
              >
                <span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                {/* 썸네일 */}
                <div className="relative hidden h-14 w-[88px] overflow-hidden bg-muted sm:block">
                  {log.thumbnailUrl ? (
                    <Image
                      src={log.thumbnailUrl}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <FileText className="h-7 w-7 text-muted-foreground/50" aria-hidden />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-primary">
                      {formatRoundLabel(log)}
                    </span>
                    {log.field && (
                      <span className="text-[10px] text-muted-foreground">
                        {log.field}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                    {log.title}
                  </p>

                  {log.excerpt && (
                    <p className="mt-1 hidden line-clamp-1 text-xs leading-relaxed text-muted-foreground sm:block">
                      {log.excerpt}
                    </p>
                  )}

                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
