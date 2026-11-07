"use client";

import type { HackathonSubmission, HackathonTeam } from "@/domain/hackathon/types";
import { formatKstHourMinute } from "./liveFormat";

interface TeamCardProps {
  team: HackathonTeam;
  submission: HackathonSubmission | null;
  /** 방금 제출·수정된 경우의 강조 토큰 (애니메이션 재시작용) */
  highlightToken?: number;
  /** 미제출 팀에 보여 줄 문구 (제작 중 / 미제출) */
  pendingLabel: string;
}

function Tag({ children, tone }: { children: string; tone: "muted" | "amber" }) {
  const toneClass =
    tone === "amber"
      ? "border-[var(--hl-amber)] text-[var(--hl-amber)]"
      : "border-[var(--hl-line-strong)] text-[var(--hl-mint)]";
  return (
    <span className={`hl-t-micro rounded-full border px-3 py-0.5 font-bold ${toneClass}`}>
      {children}
    </span>
  );
}

function SubmittedBody({ submission }: { submission: HackathonSubmission }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-2">
      <p className="hl-t-md truncate font-black text-[var(--hl-text)]">{submission.projectName}</p>
      <p className="hl-t-sm line-clamp-2 font-medium text-[var(--hl-muted)]">
        {submission.oneLiner}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <span className="hl-t-sm font-mono font-semibold text-[var(--hl-green-bright)]">
          {formatKstHourMinute(submission.submittedAt)} 제출
        </span>
        {submission.submitCount > 1 && <Tag tone="muted">{`수정 ${submission.submitCount - 1}회`}</Tag>}
        {submission.isLate && <Tag tone="amber">지각</Tag>}
      </div>
    </div>
  );
}

function StatusPill({ isSubmitted }: { isSubmitted: boolean }) {
  return isSubmitted ? (
    <span className="hl-t-sm shrink-0 rounded-full bg-[var(--hl-green)] px-4 py-1 font-bold text-white">
      제출 완료
    </span>
  ) : (
    <span className="hl-t-sm shrink-0 rounded-full border border-dashed border-[var(--hl-dim)] px-4 py-1 font-bold text-[var(--hl-dim)]">
      미제출
    </span>
  );
}

/**
 * 팀 카드: 팀명·구성원·제출 상태. 득표 수는 표시하지 않습니다.
 *
 * @param {TeamCardProps} props - 팀·제출물·강조 토큰
 */
export function TeamCard({ team, submission, highlightToken, pendingLabel }: TeamCardProps) {
  const isSubmitted = submission !== null;
  const surface = isSubmitted
    ? "border-[var(--hl-line-strong)] bg-[linear-gradient(160deg,var(--hl-surface-2),var(--hl-surface))]"
    : "border-[var(--hl-line)] bg-[rgb(7_19_11/0.6)]";
  return (
    <article
      key={highlightToken}
      className={`relative flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden rounded-[calc(var(--u)*1.6)] border-2 px-6 py-5 ${surface} ${highlightToken ? "hl-card-pop" : ""}`}
    >
      {highlightToken && (
        <span
          aria-hidden
          className="hl-flash pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_top,rgb(100_205_82/0.55),transparent_75%)]"
        />
      )}
      <header className="relative flex items-center justify-between gap-3">
        <h3 className="hl-t-lg font-black">{team.name}</h3>
        <StatusPill isSubmitted={isSubmitted} />
      </header>
      <p className="hl-t-sm relative line-clamp-2 font-medium text-[var(--hl-muted)]">
        {team.members.map((m) => m.name).join(" · ")}
      </p>
      <div className="relative h-px shrink-0 bg-[var(--hl-line)]" />
      {submission ? (
        <SubmittedBody submission={submission} />
      ) : (
        <p className="hl-t-base relative font-semibold text-[var(--hl-dim)]">{pendingLabel}</p>
      )}
    </article>
  );
}
