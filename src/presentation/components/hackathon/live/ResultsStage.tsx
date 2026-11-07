"use client";

import type { CSSProperties } from "react";
import { pickTopCriteria, type ResultRow } from "./liveFormat";

interface ResultsStageProps {
  rows: readonly ResultRow[];
}

/** 순위 공개 간격 — 아래 순위부터 차례로 올라옵니다. */
const REVEAL_STEP_MS = 550;
const TOP_CRITERIA_COUNT = 2;

function ScoreSummary({ row }: { row: ResultRow }) {
  if (!row.score) {
    return <span className="hl-t-md font-bold text-[var(--hl-dim)]">채점 중</span>;
  }
  return (
    <span className="flex items-baseline gap-2 font-mono">
      <span className="hl-t-xl font-black text-[var(--hl-text)]">{row.score.total}</span>
      <span className="hl-t-sm font-semibold text-[var(--hl-muted)]">/ {row.score.max}</span>
    </span>
  );
}

function CriteriaChips({ row }: { row: ResultRow }) {
  if (!row.score) return null;
  return (
    <ul className="flex shrink-0 gap-3">
      {pickTopCriteria(row.score.criteria, TOP_CRITERIA_COUNT).map((c) => (
        <li
          key={c.key}
          className="hl-t-micro rounded-full border border-[var(--hl-line-strong)] px-4 py-1 font-semibold text-[var(--hl-mint)]"
        >
          {c.label} {c.score}/{c.max}
        </li>
      ))}
    </ul>
  );
}

function ResultLine({ row, delayMs }: { row: ResultRow; delayMs: number }) {
  const isWinner = row.rank === 1;
  const style: CSSProperties = { animationDelay: `${delayMs}ms` };
  return (
    <li
      style={style}
      className={`hl-rise flex min-h-0 flex-1 items-center gap-8 rounded-[calc(var(--u)*1.4)] border px-8 ${
        isWinner
          ? "border-[var(--hl-green-bright)] bg-[color-mix(in_srgb,var(--hl-green)_22%,transparent)]"
          : "border-[var(--hl-line)] bg-[var(--hl-surface)]"
      }`}
    >
      <span
        className={`hl-t-xl w-[calc(var(--u)*7)] shrink-0 font-mono font-black ${isWinner ? "text-[var(--hl-green-bright)]" : "text-[var(--hl-muted)]"}`}
      >
        {row.rank ?? "–"}
      </span>
      <div className="flex min-w-0 flex-1 items-baseline gap-5">
        <span className="hl-t-lg shrink-0 font-black">{row.team.name}</span>
        <span className="hl-t-md truncate font-semibold text-[var(--hl-muted)]">
          {row.submission?.projectName ?? "미제출"}
        </span>
      </div>
      <CriteriaChips row={row} />
      <div className="flex w-[calc(var(--u)*16)] shrink-0 justify-end">
        <ScoreSummary row={row} />
      </div>
    </li>
  );
}

/**
 * AI 인정상 결과: 총점 내림차순 순위표. 아래 순위부터 차례로 공개합니다.
 *
 * @param {ResultsStageProps} props - 정렬된 순위 행
 */
export function ResultsStage({ rows }: ResultsStageProps) {
  const lastIndex = rows.length - 1;
  return (
    <section aria-label="AI 인정상 결과" className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex items-baseline gap-6">
        <h2 className="hl-t-lg font-black text-[var(--hl-green-bright)]">AI 인정상 결과</h2>
        <span className="hl-t-sm font-semibold text-[var(--hl-muted)]">
          AI 심사위원 채점 총점 순
        </span>
      </div>
      <ol className="flex min-h-0 flex-1 flex-col gap-3">
        {rows.map((row, index) => (
          <ResultLine key={row.team.id} row={row} delayMs={(lastIndex - index) * REVEAL_STEP_MS} />
        ))}
      </ol>
    </section>
  );
}
