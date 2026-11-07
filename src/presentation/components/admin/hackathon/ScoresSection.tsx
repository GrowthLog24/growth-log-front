"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  HackathonScore,
  HackathonSubmission,
  HackathonTeam,
} from "@/domain/hackathon/types";
import { formatKstDateTime } from "@/shared/lib/hackathonExport";

interface ScoresSectionProps {
  teams: readonly HackathonTeam[];
  submissions: readonly HackathonSubmission[];
  scores: readonly HackathonScore[];
}

/** 채점 순위 행 */
interface RankedScore {
  rank: number;
  score: HackathonScore;
  teamName: string;
  needsRegrade: boolean;
}

/**
 * 총점 내림차순으로 순위를 매깁니다. 동점은 같은 순위입니다.
 */
function rankScores(
  teams: readonly HackathonTeam[],
  submissions: readonly HackathonSubmission[],
  scores: readonly HackathonScore[]
): RankedScore[] {
  const sorted = [...scores].sort((a, b) => b.total - a.total);
  return sorted.map((score) => {
    const submission = submissions.find((s) => s.teamId === score.teamId);
    const rank = sorted.findIndex((other) => other.total === score.total) + 1;
    return {
      rank,
      score,
      teamName: teams.find((team) => team.id === score.teamId)?.name ?? score.teamId,
      needsRegrade: submission !== undefined && score.submissionVersion < submission.submittedAt,
    };
  });
}

/**
 * AI 채점: 순위표, 팀별 항목 점수·코멘트·총평, 재제출 후 재채점 필요 표시
 */
export function ScoresSection({ teams, submissions, scores }: ScoresSectionProps) {
  const ranked = rankScores(teams, submissions, scores);
  const scoredIds = new Set(scores.map((score) => score.teamId));
  const ungraded = submissions.filter((s) => !scoredIds.has(s.teamId));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            AI 채점 순위 ({scores.length} / {submissions.length} 제출 채점)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ranked.length === 0 && <p className="text-sm text-muted-foreground">아직 채점 결과가 없습니다.</p>}
          {ranked.map((row) => (
            <div key={row.score.teamId} className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2">
              <span className="w-8 text-lg font-black tabular-nums">{row.rank}</span>
              <span className="min-w-20 font-semibold">{row.teamName}</span>
              <span className="font-mono tabular-nums">{row.score.total} / {row.score.max}</span>
              {row.needsRegrade && <Badge variant="destructive">재제출됨 · 재채점 필요</Badge>}
            </div>
          ))}
          {ungraded.length > 0 && (
            <p className="text-sm text-amber-700">
              미채점 제출: {ungraded.map((s) => s.teamName).join(", ")}
            </p>
          )}
        </CardContent>
      </Card>
      {ranked.map((row) => (
        <ScoreDetailCard key={row.score.teamId} row={row} />
      ))}
    </div>
  );
}

function ScoreDetailCard({ row }: { row: RankedScore }) {
  const { score } = row;
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <CardTitle className="text-base">
          {row.rank}위 · {row.teamName} — {score.total} / {score.max}
        </CardTitle>
        {row.needsRegrade && <Badge variant="destructive">재제출됨 · 재채점 필요</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>항목</TableHead>
              <TableHead className="w-24">점수</TableHead>
              <TableHead>코멘트</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {score.criteria.map((criterion) => (
              <TableRow key={criterion.key}>
                <TableCell className="font-medium">{criterion.label}</TableCell>
                <TableCell className="font-mono tabular-nums">{criterion.score} / {criterion.max}</TableCell>
                <TableCell className="whitespace-normal text-sm">{criterion.comment}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="whitespace-pre-wrap text-sm">{score.summary}</p>
        <p className="text-xs text-muted-foreground">
          채점: {score.gradedBy} · {formatKstDateTime(score.gradedAt)} · 채점 대상 제출 {formatKstDateTime(score.submissionVersion)}
        </p>
      </CardContent>
    </Card>
  );
}
