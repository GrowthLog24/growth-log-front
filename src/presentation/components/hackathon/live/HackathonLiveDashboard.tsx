"use client";

import { useEffect, useMemo, useState } from "react";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import { getHackathonPhase } from "@/domain/hackathon/rules";
import type { Hackathon, HackathonPhase } from "@/domain/hackathon/types";
import { BeforeStage, BuildingStage, EndedStage } from "./CountdownStages";
import { LiveHeader, type LiveMode } from "./LiveHeader";
import { buildLivePreview, isLivePreviewKind, type LivePreviewKind } from "./livePreview";
import { rankTeams } from "./liveFormat";
import { ResultsStage } from "./ResultsStage";
import { ArrivalToastView, StageMessage } from "./StageMessage";
import { TeamBoard } from "./TeamBoard";
import { useIsOnline, useNow, useOrigin, useQueryParam } from "./useBrowserState";
import { useLiveData, type LiveData } from "./useLiveData";
import { useSubmissionHighlights, type SubmissionArrival } from "./useSubmissionHighlights";
import { VotingStage } from "./VotingStage";
import "./live.css";

/** `?preview=` 미리보기는 개발 환경에서만 허용합니다. */
const IS_PREVIEW_ENABLED = process.env.NODE_ENV !== "production";
const PREVIEW_ARRIVAL_DELAY_MS = 1_500;
const PREVIEW_ARRIVAL: SubmissionArrival[] = [
  { teamId: "team-3", teamName: "3팀", isUpdate: false },
];

const PENDING_LABELS: Record<HackathonPhase, string> = {
  before: "시작 대기",
  building: "제작 중…",
  ended: "미제출",
};

function usePreviewKind(): LivePreviewKind | null {
  const value = useQueryParam("preview");
  return IS_PREVIEW_ENABLED && isLivePreviewKind(value) ? value : null;
}

/** 미리보기 또는 실제 구독 데이터를 고르고, 미리보기에서는 제출 알림을 한 번 흉내 냅니다. */
function useDashboardData(announce: (arrivals: SubmissionArrival[]) => void): LiveData {
  const preview = usePreviewKind();
  const live = useLiveData(preview ? null : CURRENT_HACKATHON_ID, announce);
  const [previewBase] = useState(() => Date.now());
  const previewData = useMemo(
    () => (preview ? buildLivePreview(preview, previewBase) : null),
    [preview, previewBase]
  );

  useEffect(() => {
    if (preview !== "building") return;
    const timer = setTimeout(() => announce(PREVIEW_ARRIVAL), PREVIEW_ARRIVAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [preview, announce]);

  return previewData ?? live;
}

function getLiveMode(config: Hackathon, phase: HackathonPhase): LiveMode {
  if (config.scoresPublic) return "results";
  if (config.votingOpen) return "voting";
  return phase;
}

interface MainStageProps {
  data: LiveData & { config: Hackathon };
  now: number;
  phase: HackathonPhase;
  origin: string;
}

function MainStage({ data, now, phase, origin }: MainStageProps) {
  const { config, submissions, scores } = data;
  const submitUrl = origin ? `${origin}/hackathon` : "";
  const voteUrl = origin ? `${origin}/hackathon/vote` : "";

  if (config.scoresPublic) {
    return (
      <div className="flex h-full min-h-0 gap-10">
        <div className="min-w-0 flex-1">
          <ResultsStage rows={rankTeams(config.teams, scores, submissions)} />
        </div>
        {config.votingOpen && <VotingStage voteUrl={voteUrl} isCompact />}
      </div>
    );
  }
  if (config.votingOpen) return <VotingStage voteUrl={voteUrl} />;
  if (phase === "before") return <BeforeStage config={config} now={now} submitUrl={submitUrl} />;
  if (phase === "building") return <BuildingStage config={config} now={now} submitUrl={submitUrl} />;
  const submittedCount = new Set(submissions.map((s) => s.teamId)).size;
  return <EndedStage config={config} submittedCount={submittedCount} />;
}

/**
 * 100분 해커톤 빔 프로젝터용 실시간 대시보드.
 * 행사 설정·제출물(·공개 시 채점 결과)을 onSnapshot으로 구독하고 1초마다 시계를 갱신합니다.
 */
export function HackathonLiveDashboard() {
  const { highlights, toast, announce } = useSubmissionHighlights();
  const data = useDashboardData(announce);
  const now = useNow();
  const origin = useOrigin();
  const isOnline = useIsOnline();
  const { config } = data;
  const isReady = config !== undefined && now > 0;
  const phase = config && now > 0 ? getHackathonPhase(now, config) : null;

  return (
    <div className="hl-stage relative flex h-dvh w-full flex-col overflow-hidden font-sans">
      <LiveHeader
        now={now}
        mode={config && phase ? getLiveMode(config, phase) : null}
        isDisconnected={data.isDisconnected || !isOnline}
      />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-6 px-12 pb-8 pt-7">
        {!isReady && <StageMessage title="연결 중…" description="실시간 현황을 불러오고 있습니다" />}
        {isReady && !config && (
          <StageMessage title="행사 준비 중" description="곧 100분 해커톤이 시작됩니다" />
        )}
        {config && phase && (
          <>
            <div className="min-h-0 flex-1">
              <MainStage data={{ ...data, config }} now={now} phase={phase} origin={origin} />
            </div>
            <div className="h-[calc(var(--u)*35)] shrink-0">
              <TeamBoard
                teams={config.teams}
                submissions={data.submissions}
                highlights={highlights}
                pendingLabel={PENDING_LABELS[phase]}
              />
            </div>
          </>
        )}
      </main>
      <ArrivalToastView toast={toast} />
    </div>
  );
}
