"use client";

import { useCallback, useState } from "react";
import { AlertCircle, CircleCheckBig, Hourglass, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import type { Hackathon } from "@/domain/hackathon/types";
import { ConfirmVoteDialog } from "./ConfirmVoteDialog";
import { MemberPicker } from "./MemberPicker";
import { TeamPicker } from "./TeamPicker";
import { VoteStatusPanel } from "./VoteStatusPanel";
import { useStoredVote } from "./useStoredVote";
import { useVoteFlow } from "./useVoteFlow";
import { useAttendees, useHackathonConfig, useTeamSubmissions } from "./useVoteData";
import type { StoredVote } from "./voteView";

function VoteHeader() {
  return (
    <header className="flex flex-col gap-2 pt-10 pb-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-green-1">GROWTH LOG · 100분 해커톤</p>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-gray-black">
        휴먼 인정상 투표
      </h1>
      <p className="text-[15px] text-gray-1">오늘 QR 출석한 회원 1인 1표 · 본인 팀 제외</p>
    </header>
  );
}

function DoneScreen({ vote, onReset }: { vote: StoredVote; onReset: () => void }) {
  return (
    <VoteStatusPanel
      icon={<CircleCheckBig />}
      tone="brand"
      title="투표 완료! 감사합니다"
      description={`${vote.name ? `${vote.name}님의 ` : ""}소중한 한 표가 기록되었어요. 결과는 시상 때 발표돼요.`}
    >
      <Button variant="link" size="sm" onClick={onReset} className="text-gray-2">
        이 기기로 다른 회원이 투표하기
      </Button>
    </VoteStatusPanel>
  );
}

function OpenVoting({ config, onVoted }: { config: Hackathon; onVoted: (vote: StoredVote) => void }) {
  const attendees = useAttendees(true);
  const submissions = useTeamSubmissions(config.id);
  const flow = useVoteFlow({ onVoted, onStaleAttendees: attendees.reload });

  if (!flow.voter) {
    return (
      <MemberPicker state={attendees.state} onReload={attendees.reload} onSelect={flow.selectVoter} />
    );
  }
  return (
    <>
      <TeamPicker
        voter={flow.voter}
        teams={config.teams ?? []}
        submissions={submissions}
        error={flow.error}
        onBack={() => flow.selectVoter(null)}
        onPick={flow.pickTeam}
      />
      <ConfirmVoteDialog
        open={flow.isConfirmOpen}
        team={flow.pendingTeam}
        isSubmitting={flow.isSubmitting}
        onCancel={flow.cancelConfirm}
        onConfirm={flow.confirm}
      />
    </>
  );
}

function VoteBody() {
  const { state, retry } = useHackathonConfig(CURRENT_HACKATHON_ID);
  const { storedVote, saveVote, clearVote } = useStoredVote(CURRENT_HACKATHON_ID);
  // localStorage가 막힌 기기에서도 완료 화면을 보여주기 위한 메모리 기록
  const [sessionVote, setSessionVote] = useState<StoredVote | null>(null);
  const doneVote = storedVote ?? sessionVote;

  const handleVoted = useCallback(
    (vote: StoredVote) => {
      setSessionVote(vote);
      saveVote(vote);
    },
    [saveVote]
  );
  const handleReset = useCallback(() => {
    setSessionVote(null);
    clearVote();
  }, [clearVote]);

  if (state.status === "loading") {
    return (
      <div className="flex justify-center py-20" role="status" aria-label="불러오는 중">
        <Loader2 className="size-8 animate-spin text-green-1" aria-hidden="true" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <VoteStatusPanel icon={<AlertCircle />} tone="danger" title="연결이 원활하지 않아요" description="네트워크를 확인한 뒤 다시 시도해 주세요.">
        <Button onClick={retry}>다시 시도</Button>
      </VoteStatusPanel>
    );
  }
  const { config } = state;
  if (!config || !config.meetingId) {
    return <VoteStatusPanel icon={<Wrench />} title="투표 준비 중" description="운영진이 투표를 준비하고 있어요. 잠시만 기다려 주세요." isLive />;
  }
  if (doneVote) return <DoneScreen vote={doneVote} onReset={handleReset} />;
  if (!config.votingOpen) {
    return <VoteStatusPanel icon={<Hourglass />} tone="brand" title="발표가 끝나면 투표가 열려요" description="투표가 시작되면 이 화면이 자동으로 바뀌어요. 창을 닫지 말고 기다려 주세요." isLive />;
  }
  return <OpenVoting config={config} onVoted={handleVoted} />;
}

/**
 * 휴먼 인정상 투표 화면 (/hackathon/vote).
 *
 * 행사 설정을 실시간 구독해 투표 개방 시 자동으로 열리고,
 * 출석 회원 이름 선택 → 팀 선택 → 확인 → 제출 순으로 진행합니다. 득표 현황은 노출하지 않습니다.
 *
 * @returns {JSX.Element} 투표 화면
 */
export function VoteApp() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(120%_60%_at_50%_0%,rgba(0,150,43,0.08),transparent_70%),#FCFCFC]">
      <main className="mx-auto flex w-full max-w-md flex-col px-4 pb-16">
        <VoteHeader />
        <VoteBody />
      </main>
    </div>
  );
}
