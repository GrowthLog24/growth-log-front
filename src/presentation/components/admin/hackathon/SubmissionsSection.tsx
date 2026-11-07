"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { HACKATHON_TRACKS } from "@/domain/hackathon/constants";
import { isHttpUrl } from "@/domain/hackathon/rules";
import type { HackathonSubmission, HackathonTeam } from "@/domain/hackathon/types";
import {
  buildTeamMarkdown,
  formatKstTime,
  formatTeamMembers,
  pairTeamsWithSubmissions,
} from "@/shared/lib/hackathonExport";
import { copyToClipboard } from "./copyToClipboard";

interface SubmissionsSectionProps {
  teams: readonly HackathonTeam[];
  submissions: readonly HackathonSubmission[];
}

/** 표 열 수 (펼친 기획 행의 colSpan) */
const COLUMN_COUNT = 9;

/**
 * 제출 현황: 팀 × 제출물 표, 행을 펼치면 기획 문서(목적/핵심 기능/예상 결과)
 */
export function SubmissionsSection({ teams, submissions }: SubmissionsSectionProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const pairs = pairTeamsWithSubmissions(teams, submissions);
  const submittedCount = pairs.filter((pair) => pair.submission).length;

  const toggle = (key: string) => {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpanded(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          제출 현황 ({submittedCount} / {pairs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>팀</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>트랙</TableHead>
              <TableHead>링크</TableHead>
              <TableHead>한 줄 소개</TableHead>
              <TableHead>제출 시각</TableHead>
              <TableHead>횟수</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pairs.map(({ team, submission }) => {
              const key = team?.id ?? submission?.teamId ?? "";
              return (
                <Fragment key={key}>
                  <SubmissionRow
                    team={team}
                    submission={submission}
                    isExpanded={expanded.has(key)}
                    onToggle={() => toggle(key)}
                  />
                  {submission && expanded.has(key) && <PlanRow team={team} submission={submission} />}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface SubmissionRowProps {
  team: HackathonTeam | undefined;
  submission: HackathonSubmission | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}

function SubmissionRow({ team, submission, isExpanded, onToggle }: SubmissionRowProps) {
  const teamName = team?.name ?? submission?.teamName ?? "-";
  return (
    <TableRow>
      <TableCell>
        {submission && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onToggle} aria-label="기획 보기">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </TableCell>
      <TableCell className="align-top">
        <p className="font-semibold">{teamName}</p>
        <p className="max-w-40 truncate text-xs text-muted-foreground">{formatTeamMembers(team)}</p>
        {!team && <Badge variant="destructive">설정에 없는 팀</Badge>}
      </TableCell>
      {submission ? (
        <SubmittedCells submission={submission} />
      ) : (
        <TableCell colSpan={COLUMN_COUNT - 2} className="text-muted-foreground">
          미제출
        </TableCell>
      )}
    </TableRow>
  );
}

function SubmittedCells({ submission }: { submission: HackathonSubmission }) {
  const track = HACKATHON_TRACKS[submission.track];
  return (
    <>
      <TableCell className="max-w-48 whitespace-normal font-medium">{submission.projectName}</TableCell>
      <TableCell>
        <Badge variant="outline">{submission.track}{track ? ` · ${track.name}` : ""}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5 text-xs">
          <ExternalLinkItem href={submission.githubUrl} label="GitHub" />
          <ExternalLinkItem href={submission.deployUrl} label="배포" />
          <ExternalLinkItem href={submission.demoUrl} label="시연" />
          <ExternalLinkItem href={submission.prdUrl} label="PRD" />
        </div>
      </TableCell>
      <TableCell className="max-w-60 whitespace-normal text-sm">{submission.oneLiner}</TableCell>
      <TableCell className="font-mono text-sm tabular-nums">{formatKstTime(submission.submittedAt)}</TableCell>
      <TableCell className="tabular-nums">{submission.submitCount}</TableCell>
      <TableCell>
        {submission.isLate ? <Badge variant="destructive">지각</Badge> : <Badge variant="secondary">정시</Badge>}
      </TableCell>
    </>
  );
}

function ExternalLinkItem({ href, label }: { href: string; label: string }) {
  if (!href) return <span className="text-muted-foreground">{label} -</span>;
  // 외부 입력값이므로 http(s)만 링크로 렌더링 (javascript: 등 차단)
  if (!isHttpUrl(href)) return <span className="text-destructive">{label} (잘못된 링크)</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
      {label} ↗
    </a>
  );
}

function PlanRow({ team, submission }: { team: HackathonTeam | undefined; submission: HackathonSubmission }) {
  const sections = [
    ["목적", submission.planPurpose],
    ["핵심 기능·비즈니스 로직", submission.planFeatures],
    ["예상 결과", submission.planExpected],
  ] as const;

  const copyTeam = () =>
    void copyToClipboard(
      buildTeamMarkdown(team, submission),
      `${submission.teamName} 제출물을 Markdown으로 복사했습니다.`
    );

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={COLUMN_COUNT} className="whitespace-normal">
        <div className="grid gap-4 md:grid-cols-3">
          {sections.map(([title, body]) => (
            <div key={title} className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">{title}</p>
              <p className="whitespace-pre-wrap text-sm">{body || "-"}</p>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="mt-3" onClick={copyTeam}>
          <Copy className="mr-1 h-3.5 w-3.5" /> 이 팀 Markdown 복사
        </Button>
      </TableCell>
    </TableRow>
  );
}
