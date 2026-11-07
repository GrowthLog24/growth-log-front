"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tallyVotes } from "@/domain/hackathon/rules";
import type { HackathonTeam, HackathonVote } from "@/domain/hackathon/types";
import { formatKstTime } from "@/shared/lib/hackathonExport";

interface VotesSectionProps {
  teams: readonly HackathonTeam[];
  votes: readonly HackathonVote[];
}

/**
 * 휴먼 투표 집계 (admin 전용): 팀별 득표 순위, 총 투표 수, 투표자 목록
 */
export function VotesSection({ teams, votes }: VotesSectionProps) {
  const tally = tallyVotes(teams, votes);
  const maxCount = Math.max(1, ...tally.map((row) => row.count));
  const knownIds = new Set(teams.map((team) => team.id));
  const unknownVotes = votes.filter((vote) => !knownIds.has(vote.teamId)).length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">득표 순위 (총 {votes.length}표)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tally.map(({ team, count }, index) => (
            <div key={team.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                  {count > 0 ? `${index + 1}. ` : ""}{team.name}
                </span>
                <span className="font-mono tabular-nums">{count}표</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full origin-left rounded-full bg-primary transition-transform"
                  style={{ transform: `scaleX(${count / maxCount})` }}
                />
              </div>
            </div>
          ))}
          {tally.length === 0 && <p className="text-sm text-muted-foreground">팀이 없습니다.</p>}
          {unknownVotes > 0 && (
            <p className="text-sm text-destructive">설정에 없는 팀에 대한 투표 {unknownVotes}건 (집계 제외)</p>
          )}
        </CardContent>
      </Card>
      <VoterListCard teams={teams} votes={votes} />
    </div>
  );
}

function VoterListCard({ teams, votes }: VotesSectionProps) {
  const sorted = [...votes].sort((a, b) => a.createdAt - b.createdAt);
  const teamName = (teamId: string) => teams.find((team) => team.id === teamId)?.name ?? teamId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">투표자 목록</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[32rem] overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 투표가 없습니다.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시각</TableHead>
                <TableHead>투표자</TableHead>
                <TableHead>선택 팀</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((vote) => (
                <TableRow key={vote.id}>
                  <TableCell className="font-mono text-xs tabular-nums">{formatKstTime(vote.createdAt)}</TableCell>
                  <TableCell>{vote.memberName}</TableCell>
                  <TableCell>{teamName(vote.teamId)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
