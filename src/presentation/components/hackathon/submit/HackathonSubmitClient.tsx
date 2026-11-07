"use client";

import { Loader2 } from "lucide-react";
import { isSubmissionClosed } from "@/app/api/hackathon/submit/submitPolicy";
import type { Hackathon } from "@/domain/hackathon/types";
import { PhaseCountdown } from "./PhaseCountdown";
import { SubmissionForm } from "./SubmissionForm";
import { SubmitSuccess } from "./SubmitSuccess";
import { TeamGate } from "./TeamGate";
import { useHackathonConfig, useNow } from "./useHackathonLive";
import { useTeamStage, type TeamStage } from "./useTeamStage";

function Notice({ title, body, isLoading = false }: { title: string; body?: string; isLoading?: boolean }) {
  return (
    <div role="status" className="rounded-2xl border border-gray-5 bg-white px-5 py-10 text-center">
      {isLoading && <Loader2 className="mx-auto mb-3 size-6 animate-spin text-green-1" aria-hidden />}
      <p className="text-base font-bold text-gray-black">{title}</p>
      {body && <p className="mt-1 text-sm text-gray-1">{body}</p>}
    </div>
  );
}

function TeamBar({ config, teamId, onChangeTeam }: { config: Hackathon; teamId: string; onChangeTeam: () => void }) {
  const team = config.teams.find((candidate) => candidate.id === teamId);
  const members = team?.members.map((member) => member.name).join(", ") ?? "";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-green-9/25 px-4 py-3">
      <p className="min-w-0 text-sm">
        <span className="font-bold text-green-1">{team?.name ?? teamId}</span>
        {members && <span className="ml-2 truncate text-gray-1">{members}</span>}
      </p>
      <button
        type="button"
        onClick={onChangeTeam}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-gray-1 underline-offset-2 hover:text-gray-black hover:underline focus-visible:outline-2 focus-visible:outline-green-1"
      >
        팀 바꾸기
      </button>
    </div>
  );
}

interface StageViewProps {
  config: Hackathon;
  stage: TeamStage;
  isClosed: boolean;
  actions: ReturnType<typeof useTeamStage>;
}

function StageView({ config, stage, isClosed, actions }: StageViewProps) {
  if (stage.kind === "restoring") return <Notice title="팀 정보를 확인하고 있어요" isLoading />;
  if (stage.kind === "gate") {
    return (
      <div className="space-y-4">
        {stage.notice && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{stage.notice}</p>
        )}
        <TeamGate teams={config.teams} onVerified={actions.handleVerified} />
      </div>
    );
  }
  const { auth } = stage;
  return (
    <div className="space-y-4">
      <TeamBar config={config} teamId={auth.teamId} onChangeTeam={() => actions.changeTeam()} />
      {stage.kind === "done" ? (
        <SubmitSuccess submission={stage.submission} />
      ) : (
        <SubmissionForm
          auth={auth}
          initial={stage.initial}
          isClosed={isClosed}
          onSubmitted={(submission) => actions.handleSubmitted(auth, submission)}
          onAuthExpired={actions.handleAuthExpired}
        />
      )}
    </div>
  );
}

/**
 * 100분 해커톤 팀 제출 화면 (컨테이너).
 * 행사 설정을 실시간 구독하고, 팀 확인 → 제출서 작성 → 제출 완료 흐름을 관리합니다.
 */
export function HackathonSubmitClient() {
  const configState = useHackathonConfig();
  const now = useNow();
  const actions = useTeamStage();
  const config = configState.status === "ready" ? configState.config : null;

  return (
    <div className="min-h-full bg-gray-6">
      {config && <PhaseCountdown startAt={config.startAt} endAt={config.endAt} now={now} />}
      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 pb-16">
        <header className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-green-1">그로스로그 6기 · 100분 해커톤</p>
          <h1 className="text-2xl font-extrabold text-gray-black sm:text-3xl">100분 해커톤 · 제출</h1>
          <p className="text-sm text-gray-1">팀을 확인한 뒤 결과물을 제출해 주세요. 제출은 팀당 1회만 가능하니, 모두 완성한 뒤 한 번에 제출해 주세요.</p>
        </header>

        {configState.status === "loading" && <Notice title="행사 정보를 불러오고 있어요" isLoading />}
        {configState.status === "error" && (
          <Notice title="행사 정보를 불러오지 못했어요" body="새로고침하거나 운영진에게 문의해 주세요." />
        )}
        {configState.status === "ready" && !config && (
          <Notice title="행사 준비 중" body="잠시 후 다시 열어 주세요." />
        )}
        {config && (
          <StageView config={config} stage={actions.stage} isClosed={isSubmissionClosed(now, config.endAt)} actions={actions} />
        )}
      </div>
    </div>
  );
}
