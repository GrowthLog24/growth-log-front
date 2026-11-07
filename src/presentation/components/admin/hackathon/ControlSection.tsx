"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRemaining, getHackathonPhase } from "@/domain/hackathon/rules";
import type { Hackathon, HackathonPhase } from "@/domain/hackathon/types";
import type { Meeting } from "@/domain/entities";
import { formatKstDateTime } from "@/shared/lib/hackathonExport";
import { fromKstInputValue, toKstInputValue } from "./hackathonAdminUtils";
import { saveConfigPatch } from "./saveConfigPatch";
import { useNow } from "./useHackathonAdminData";
import { ConfirmToggleRow } from "./ConfirmToggleRow";
import { MeetingSelector } from "./MeetingSelector";

const PHASE_LABELS: Record<HackathonPhase, string> = {
  before: "시작 전",
  building: "제작 중",
  ended: "마감",
};

const MINUTE_MS = 60 * 1000;

const PUBLIC_LINKS = [
  { href: "/hackathon", label: "제출 페이지" },
  { href: "/hackathon/live", label: "라이브 대시보드" },
  { href: "/hackathon/vote", label: "휴먼 투표" },
] as const;

interface ControlSectionProps {
  hackathonId: string;
  config: Hackathon;
  meetings: readonly Meeting[];
  checkinMeetingId: string | null;
}

/**
 * 진행 제어: 단계·남은 시간, 일정 수정, 투표·점수 공개 토글, 출석 회차 선택, 공개 화면 링크
 */
export function ControlSection({
  hackathonId,
  config,
  meetings,
  checkinMeetingId,
}: ControlSectionProps) {
  return (
    <div className="space-y-4">
      <PhaseStatusCard config={config} />
      <ScheduleEditorCard hackathonId={hackathonId} config={config} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">공개 제어</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfirmToggleRow
            label="휴먼 투표 열기"
            description="출석 체크한 회원이 /hackathon/vote 에서 투표할 수 있습니다."
            checked={config.votingOpen}
            onConfirm={(next) =>
              saveConfigPatch(
                hackathonId,
                { votingOpen: next },
                next ? "휴먼 투표를 열었습니다." : "휴먼 투표를 닫았습니다."
              )
            }
          />
          <ConfirmToggleRow
            label="AI 점수 대시보드 공개"
            description="라이브 대시보드에 AI 채점 결과가 공개됩니다."
            checked={config.scoresPublic}
            onConfirm={(next) =>
              saveConfigPatch(
                hackathonId,
                { scoresPublic: next },
                next ? "AI 점수를 공개했습니다." : "AI 점수를 비공개로 바꿨습니다."
              )
            }
          />
          <MeetingSelector
            hackathonId={hackathonId}
            meetingId={config.meetingId}
            meetings={meetings}
            checkinMeetingId={checkinMeetingId}
          />
        </CardContent>
      </Card>
      <PublicLinksCard />
    </div>
  );
}

function PhaseStatusCard({ config }: { config: Hackathon }) {
  const now = useNow();
  const phase = getHackathonPhase(now, config);
  const remaining =
    phase === "before" ? config.startAt - now : phase === "building" ? config.endAt - now : 0;
  const remainingLabel =
    phase === "before" ? "시작까지" : phase === "building" ? "마감까지" : "종료됨";

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-6 py-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">진행 단계</p>
          <Badge variant={phase === "building" ? "default" : "secondary"} className="text-sm">
            {PHASE_LABELS[phase]}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{remainingLabel}</p>
          <p className="font-mono text-3xl font-bold tabular-nums">
            {formatRemaining(remaining)}
          </p>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>시작 {formatKstDateTime(config.startAt)}</p>
          <p>마감 {formatKstDateTime(config.endAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleEditorCard({ hackathonId, config }: { hackathonId: string; config: Hackathon }) {
  const [draft, setDraft] = useState<{ start: string; end: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const start = draft?.start ?? toKstInputValue(config.startAt);
  const end = draft?.end ?? toKstInputValue(config.endAt);

  const save = async (patch: Partial<Pick<Hackathon, "startAt" | "endAt">>, message: string) => {
    setSaving(true);
    const ok = await saveConfigPatch(hackathonId, patch, message);
    setSaving(false);
    if (ok) setDraft(null);
  };

  const saveDraft = () => {
    const startAt = fromKstInputValue(start);
    const endAt = fromKstInputValue(end);
    if (startAt === null || endAt === null) {
      toast.error("시각 형식이 올바르지 않습니다.");
      return;
    }
    if (endAt <= startAt) {
      toast.error("마감은 시작보다 늦어야 합니다.");
      return;
    }
    void save({ startAt, endAt }, "일정을 저장했습니다.");
  };

  const extend = (minutes: number) =>
    void save({ endAt: config.endAt + minutes * MINUTE_MS }, `마감을 ${minutes}분 연장했습니다.`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">일정 (KST)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <TimeField id="hk-start" label="제작 시작" value={start} onChange={(v) => setDraft({ start: v, end })} />
        <TimeField id="hk-end" label="제출 마감" value={end} onChange={(v) => setDraft({ start, end: v })} />
        <Button onClick={saveDraft} disabled={saving || draft === null}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          저장
        </Button>
        {draft !== null && (
          <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
            되돌리기
          </Button>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => extend(5)} disabled={saving}>마감 +5분</Button>
          <Button variant="outline" onClick={() => extend(10)} disabled={saving}>마감 +10분</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeField(props: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type="datetime-local"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-56"
      />
    </div>
  );
}

function PublicLinksCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">공개 화면</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {PUBLIC_LINKS.map((link) => (
          <Button key={link.href} variant="outline" asChild>
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label} <span className="ml-1 font-mono text-xs text-muted-foreground">{link.href}</span>
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
