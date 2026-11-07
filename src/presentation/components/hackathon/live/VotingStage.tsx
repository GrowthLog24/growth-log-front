"use client";

import { QrTile } from "./QrTile";

interface VotingStageProps {
  /** 투표 페이지 전체 주소 */
  voteUrl: string;
  /** 결과 화면 위에 작게 띄울 때 true */
  isCompact?: boolean;
}

const VOTE_STEPS = [
  "휴대폰 카메라로 QR을 스캔하세요",
  "가장 마음에 드는 팀을 하나 고르세요",
  "본인 팀에는 투표할 수 없어요",
];

/**
 * 휴먼 인정상 투표 안내. 득표 수는 보여 주지 않습니다.
 *
 * @param {VotingStageProps} props - 투표 주소와 표시 크기
 */
export function VotingStage({ voteUrl, isCompact = false }: VotingStageProps) {
  if (isCompact) {
    return (
      <aside className="hl-rise rounded-[calc(var(--u)*2)] border-2 border-[var(--hl-mint)] bg-[var(--hl-surface)] px-6 py-5">
        {voteUrl && <QrTile url={voteUrl} sizeU={18} title="휴먼 인정상 투표" />}
      </aside>
    );
  }
  return (
    <section
      aria-label="휴먼 인정상 투표"
      className="hl-rise grid h-full grid-cols-[1fr_auto] items-center gap-16"
    >
      <div className="flex min-w-0 flex-col gap-8">
        <p className="hl-t-lg font-bold text-[var(--hl-mint)]">지금 투표하세요</p>
        <h2 className="hl-t-2xl font-black tracking-tight">휴먼 인정상 투표</h2>
        <p className="hl-t-lg font-bold text-[var(--hl-green-bright)]">
          오늘 QR 출석한 회원 1인 1표
        </p>
        <ol className="hl-t-md flex flex-col gap-3 font-medium text-[var(--hl-muted)]">
          {VOTE_STEPS.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="font-mono font-bold text-[var(--hl-green-bright)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      {voteUrl && (
        <QrTile url={voteUrl} sizeU={38} title="투표 페이지" urlClassName="hl-t-md" />
      )}
    </section>
  );
}
