"use client";

import { formatRemaining } from "@/domain/hackathon/rules";
import type { Hackathon } from "@/domain/hackathon/types";
import {
  formatKstHourMinute,
  getDeadlineNotice,
  getElapsedRatio,
  getUrgencyTone,
  type DeadlineNotice,
} from "./liveFormat";
import { QrTile } from "./QrTile";

interface StageProps {
  config: Hackathon;
  now: number;
}

interface SubmitStageProps extends StageProps {
  /** 팀 제출 페이지 전체 주소 */
  submitUrl: string;
}

const MINUTE_MS = 60_000;
/** "MM:SS"보다 긴 표기 (시간 단위 포함) */
const SHORT_COUNTDOWN_LENGTH = 5;

function Countdown({ ms }: { ms: number }) {
  const text = formatRemaining(ms);
  const sizeClass = text.length > SHORT_COUNTDOWN_LENGTH ? "hl-t-display-long" : "";
  return <p className={`hl-countdown hl-t-display ${sizeClass}`}>{text}</p>;
}

function TimeWindow({ config }: { config: Hackathon }) {
  const totalMinutes = Math.round((config.endAt - config.startAt) / MINUTE_MS);
  return (
    <p className="hl-t-md font-semibold text-[var(--hl-muted)]">
      <span className="text-[var(--hl-text)]">{formatKstHourMinute(config.startAt)}</span> 시작
      <span className="mx-4 text-[var(--hl-dim)]">→</span>
      <span className="text-[var(--hl-text)]">{formatKstHourMinute(config.endAt)}</span> 마감
      <span className="mx-4 text-[var(--hl-dim)]">·</span>
      {totalMinutes}분
    </p>
  );
}

/**
 * 시작 전: 시작까지 카운트다운과 큰 제출 QR.
 *
 * @param {SubmitStageProps} props - 행사 설정·현재 시각·제출 주소
 */
export function BeforeStage({ config, now, submitUrl }: SubmitStageProps) {
  return (
    <section
      aria-label="제작 시작 카운트다운"
      className="hl-tone-calm grid h-full grid-cols-[1fr_auto] items-center gap-16"
    >
      <div className="flex min-w-0 flex-col gap-8">
        <p className="hl-t-lg font-bold text-[var(--hl-green-bright)]">제작 시작까지</p>
        <Countdown ms={config.startAt - now} />
        <TimeWindow config={config} />
      </div>
      {submitUrl && (
        <QrTile url={submitUrl} sizeU={34} title="팀 제출 페이지" urlClassName="hl-t-md" />
      )}
    </section>
  );
}

const NOTICE_HINTS: Record<number, string> = {
  20: "제출 폼을 미리 열고 링크를 준비해 주세요",
  10: "지금 제출하고, 마감 전까지 수정할 수 있어요",
  1: "지금 바로 제출해 주세요!",
};

function NoticeBanner({ notice }: { notice: DeadlineNotice }) {
  const isCritical = notice.tone === "critical";
  return (
    <div
      role="alert"
      className={`flex items-center gap-8 rounded-[calc(var(--u)*1.6)] border-2 border-[var(--hl-tone)] bg-[color-mix(in_srgb,var(--hl-tone)_16%,transparent)] px-10 py-5 ${isCritical ? "hl-pulse" : "hl-rise"}`}
    >
      <span className="hl-t-xl font-black text-[var(--hl-tone)]">
        종료 {notice.minutes}분 전
      </span>
      <span className="hl-t-md font-semibold text-[var(--hl-text)]">
        {NOTICE_HINTS[notice.minutes] ?? "마감 전에 제출해 주세요"}
      </span>
    </div>
  );
}

function ProgressTrack({ config, now }: StageProps) {
  const ratio = getElapsedRatio(now, config.startAt, config.endAt);
  const elapsedMinutes = Math.floor((now - config.startAt) / MINUTE_MS);
  const totalMinutes = Math.round((config.endAt - config.startAt) / MINUTE_MS);
  return (
    <div className="flex flex-col gap-3">
      <div
        role="progressbar"
        aria-label="제작 시간 경과"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-[calc(var(--u)*1.6)] overflow-hidden rounded-full bg-[var(--hl-surface-2)]"
      >
        <div className="hl-progress-fill size-full rounded-full" style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <div className="hl-t-sm flex justify-between font-semibold text-[var(--hl-muted)]">
        <span>{formatKstHourMinute(config.startAt)} 시작</span>
        <span className="text-[var(--hl-text)]">
          {elapsedMinutes}분 경과 / {totalMinutes}분
        </span>
        <span>{formatKstHourMinute(config.endAt)} 마감</span>
      </div>
    </div>
  );
}

/**
 * 제작 중: 남은 시간, 경과 막대, 종료 임박 공지, 모서리 제출 QR.
 *
 * @param {SubmitStageProps} props - 행사 설정·현재 시각·제출 주소
 */
export function BuildingStage({ config, now, submitUrl }: SubmitStageProps) {
  const remaining = config.endAt - now;
  const notice = getDeadlineNotice(remaining);
  return (
    <section
      aria-label="남은 제작 시간"
      className={`hl-tone-${getUrgencyTone(remaining)} grid h-full grid-cols-[1fr_auto] items-center gap-16`}
    >
      <div className="flex min-w-0 flex-col gap-7">
        {notice ? (
          <NoticeBanner key={notice.minutes} notice={notice} />
        ) : (
          <p className="hl-t-lg font-bold text-[var(--hl-green-bright)]">남은 시간</p>
        )}
        <Countdown ms={remaining} />
        <ProgressTrack config={config} now={now} />
      </div>
      {submitUrl && <QrTile url={submitUrl} sizeU={20} title="팀 제출 페이지" />}
    </section>
  );
}

interface EndedStageProps {
  config: Hackathon;
  submittedCount: number;
}

/**
 * 마감 후: 제출 마감 상태와 제출 현황 요약.
 *
 * @param {EndedStageProps} props - 행사 설정·제출 팀 수
 */
export function EndedStage({ config, submittedCount }: EndedStageProps) {
  return (
    <section aria-label="제출 마감" className="flex h-full flex-col justify-center gap-8">
      <p className="hl-t-lg font-bold text-[var(--hl-muted)]">
        {formatKstHourMinute(config.endAt)} 마감 · 모두 수고하셨습니다
      </p>
      <p className="hl-t-display text-[var(--hl-text)]">제출 마감</p>
      <p className="hl-t-md font-semibold text-[var(--hl-muted)]">
        <span className="text-[var(--hl-green-bright)]">
          {submittedCount} / {config.teams.length}팀
        </span>{" "}
        제출 완료 · 마감 이후 제출은 지각으로 표시됩니다
      </p>
    </section>
  );
}
