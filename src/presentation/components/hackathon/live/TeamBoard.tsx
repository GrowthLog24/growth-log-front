"use client";

import type { HackathonSubmission, HackathonTeam } from "@/domain/hackathon/types";
import { TeamCard } from "./TeamCard";

interface TeamBoardProps {
  teams: readonly HackathonTeam[];
  submissions: readonly HackathonSubmission[];
  /** teamId → 강조 토큰 */
  highlights: Readonly<Record<string, number>>;
  /** 미제출 팀에 보여 줄 문구 */
  pendingLabel: string;
}

/** 한 줄에 놓을 최대 카드 수 */
const MAX_COLUMNS = 5;

function SubmissionMeter({ submitted, total }: { submitted: number; total: number }) {
  return (
    <div className="flex items-center gap-5">
      <ol aria-hidden className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={`h-[calc(var(--u)*1.2)] w-[calc(var(--u)*3.2)] rounded-full ${i < submitted ? "bg-[var(--hl-green-bright)]" : "bg-[var(--hl-surface-2)]"}`}
          />
        ))}
      </ol>
      <p className="hl-t-md font-bold">
        제출{" "}
        <span className="font-mono text-[var(--hl-green-bright)]">{submitted}</span>
        <span className="font-mono text-[var(--hl-muted)]"> / {total}</span>
      </p>
    </div>
  );
}

/**
 * 팀 제출 현황 보드. 항상 화면 하단에 고정됩니다.
 *
 * @param {TeamBoardProps} props - 팀·제출물·강조 상태
 */
export function TeamBoard({ teams, submissions, highlights, pendingLabel }: TeamBoardProps) {
  const submissionByTeam = new Map(submissions.map((s) => [s.teamId, s]));
  const submitted = teams.filter((team) => submissionByTeam.has(team.id)).length;
  const columns = Math.max(1, Math.min(teams.length, MAX_COLUMNS));

  return (
    <section aria-label="팀 제출 현황" className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="hl-label">팀 제출 현황</h2>
        <SubmissionMeter submitted={submitted} total={teams.length} />
      </div>
      <div
        className="grid min-h-0 flex-1 auto-rows-fr gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            submission={submissionByTeam.get(team.id) ?? null}
            highlightToken={highlights[team.id]}
            pendingLabel={pendingLabel}
          />
        ))}
      </div>
    </section>
  );
}
