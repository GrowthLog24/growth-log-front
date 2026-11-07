"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import { HACKATHON_TRACKS } from "@/domain/hackathon/constants";
import type { HackathonSubmission } from "@/domain/hackathon/types";
import { formatKstTimeWithSeconds } from "./formatTime";

interface SubmitSuccessProps {
  submission: HackathonSubmission;
}

function LinkRow({ label, href }: { label: string; href: string }) {
  if (!href) return null;
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="shrink-0 text-xs text-gray-1">{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-w-0 items-center gap-1 truncate text-sm font-medium text-green-1 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-green-1"
      >
        <span className="truncate">{href.replace(/^https?:\/\//, "")}</span>
        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
      </a>
    </li>
  );
}

/**
 * 제출 완료 화면. 제출은 팀당 1회이므로 수정 버튼 없이 제출 내용과 문의 안내만 보여줍니다.
 */
export function SubmitSuccess({ submission }: SubmitSuccessProps) {
  const track = HACKATHON_TRACKS[submission.track];

  return (
    <section aria-labelledby="submit-success-title" className="space-y-4">
      <div role="status" className="rounded-2xl bg-gradient-brand p-5 text-white shadow-lg sm:p-6">
        <CheckCircle2 className="size-8" aria-hidden />
        <h2 id="submit-success-title" className="mt-3 text-xl font-extrabold">
          제출 완료
        </h2>
        <p className="mt-2 text-sm text-white/90">
          {formatKstTimeWithSeconds(submission.submittedAt)} 제출 · 제출은 팀당 1회라 수정할 수 없어요
          {submission.isLate && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">지각 제출</span>
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-5 bg-white p-4 sm:p-6">
        <p className="text-xs font-semibold text-green-1">
          {submission.teamName} · {submission.track} {track?.name ?? ""}
        </p>
        <h3 className="mt-1 text-lg font-bold text-gray-black">{submission.projectName}</h3>
        <p className="mt-1 text-sm text-gray-1">{submission.oneLiner}</p>
        <ul className="mt-4 divide-y divide-gray-5 border-t border-gray-5">
          <LinkRow label="GitHub" href={submission.githubUrl} />
          <LinkRow label="배포" href={submission.deployUrl} />
          <LinkRow label="시연 자료" href={submission.demoUrl} />
          <LinkRow label="PRD" href={submission.prdUrl} />
        </ul>
      </div>

      <p className="rounded-xl bg-gray-6 px-4 py-3 text-sm text-gray-1">
        잘못 낸 내용이 있으면 운영진에게 말씀해 주세요.
      </p>
    </section>
  );
}
