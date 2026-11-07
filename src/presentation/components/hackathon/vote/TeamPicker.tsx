"use client";

import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HackathonSubmission, HackathonTeam } from "@/domain/hackathon/types";
import type { AttendeeSummary } from "@/app/api/hackathon/vote/contracts";
import { isOwnTeam } from "./voteView";

interface TeamPickerProps {
  voter: AttendeeSummary;
  teams: readonly HackathonTeam[];
  submissions: Record<string, HackathonSubmission>;
  error: string | null;
  onBack: () => void;
  onPick: (team: HackathonTeam) => void;
}

function TeamCard({
  team,
  submission,
  isOwn,
  onPick,
}: {
  team: HackathonTeam;
  submission: HackathonSubmission | undefined;
  isOwn: boolean;
  onPick: (team: HackathonTeam) => void;
}) {
  const memberNames = team.members.map((member) => member.name).join(" · ");
  return (
    <li>
      <button
        type="button"
        disabled={isOwn}
        onClick={() => onPick(team)}
        aria-label={isOwn ? `${team.name} (본인 팀, 투표 불가)` : `${team.name}에 투표하기`}
        className="group flex w-full flex-col gap-2 rounded-3xl border border-gray-5 bg-white p-5 text-left shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)] transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-green-1/60 hover:shadow-[0_14px_30px_-18px_rgba(0,150,43,0.55)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-green-1/40 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-gray-6 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:border-gray-5"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold tracking-tight text-green-1 group-disabled:text-gray-2">
            {team.name}
          </span>
          {isOwn && (
            <span className="rounded-full bg-gray-5 px-2.5 py-0.5 text-xs font-semibold text-gray-1">
              본인 팀
            </span>
          )}
        </span>
        <span className="text-lg leading-snug font-bold text-gray-black">
          {submission?.projectName || "프로젝트 이름 미제출"}
        </span>
        {submission?.oneLiner && (
          <span className="text-sm leading-relaxed text-gray-1">{submission.oneLiner}</span>
        )}
        {memberNames && (
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-2">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            {memberNames}
          </span>
        )}
      </button>
    </li>
  );
}

/**
 * 2단계: 휴먼 인정상을 줄 팀을 고릅니다. 본인 팀은 선택할 수 없습니다.
 *
 * @param {TeamPickerProps} props - 투표자, 팀·제출물, 오류, 뒤로가기·선택 콜백
 * @returns {JSX.Element} 팀 선택 화면
 */
export function TeamPicker({ voter, teams, submissions, error, onBack, onPick }: TeamPickerProps) {
  return (
    <section aria-labelledby="vote-team-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 self-start text-gray-1">
          <ArrowLeft />
          이름 다시 선택
        </Button>
        <h2 id="vote-team-title" className="text-lg font-bold text-gray-black">
          {voter.name}님, 인정하고 싶은 팀을 골라 주세요
        </h2>
        <p className="text-sm text-gray-1">가장 멋졌던 팀 하나에 투표해 주세요.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {teams.length === 0 ? (
        <p className="rounded-2xl bg-gray-6 px-4 py-6 text-center text-sm text-gray-1">
          등록된 팀이 없어요. 운영진에게 알려 주세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              submission={submissions[team.id]}
              isOwn={isOwnTeam(team, voter.memberId)}
              onPick={onPick}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
