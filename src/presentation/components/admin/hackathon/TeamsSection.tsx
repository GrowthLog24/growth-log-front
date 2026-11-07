"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Printer, Save, KeyRound, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Member } from "@/domain/entities";
import type {
  Hackathon,
  HackathonSecrets,
  HackathonSubmission,
  HackathonTeam,
} from "@/domain/hackathon/types";
import { fillMissingCodes, nextTeamIdentity, reissueCode } from "./hackathonAdminUtils";
import { draftsToTeams, toTeamDrafts, validateTeamDrafts, type TeamDraft } from "./teamDraft";
import { saveConfigPatch } from "./saveConfigPatch";
import { TeamRow } from "./TeamRow";
import { TeamCodesPrintDialog } from "./TeamCodesPrintDialog";
import type { CodesUpdater } from "./useHackathonAdminData";

interface TeamsSectionProps {
  hackathonId: string;
  config: Hackathon;
  members: readonly Member[];
  submissions: readonly HackathonSubmission[];
  secrets: HackathonSecrets | null | undefined;
  updateCodes: (updater: CodesUpdater) => Promise<void>;
  reloadSecrets: () => Promise<void>;
}

/**
 * 팀 & 제출 코드: 팀 이름·팀원 편집, 팀 추가·삭제, 4자리 코드 발급·재발급, 코드 카드 인쇄
 */
export function TeamsSection(props: TeamsSectionProps) {
  const { config, members, submissions, secrets, reloadSecrets } = props;
  const editor = useTeamsEditor(props);
  const [printOpen, setPrintOpen] = useState(false);
  const { rows, codes, canWriteCodes } = editor;
  const submittedTeamIds = useMemo(() => new Set(submissions.map((s) => s.teamId)), [submissions]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">팀 & 제출 코드 ({rows.length}팀)</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={editor.addRow}>
            <Plus className="mr-1 h-4 w-4" /> 팀 추가
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canWriteCodes || config.teams.every((team) => codes[team.id])}
            onClick={() =>
              void editor.writeCodes((latest) => fillMissingCodes(latest, config.teams), "누락된 코드를 발급했습니다.")
            }
          >
            <KeyRound className="mr-1 h-4 w-4" /> 누락 코드 발급
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
            <Printer className="mr-1 h-4 w-4" /> 코드 카드 인쇄
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <SecretsStatus secrets={secrets} onReload={reloadSecrets} />
        {rows.length === 0 && <p className="text-sm text-muted-foreground">아직 팀이 없습니다. 팀을 추가해 주세요.</p>}
        {rows.map((row) => (
          <TeamRow
            key={row.id}
            draft={row}
            savedTeam={config.teams.find((team) => team.id === row.id)}
            members={members}
            code={codes[row.id]}
            hasSubmission={submittedTeamIds.has(row.id)}
            canWriteCodes={canWriteCodes}
            onChange={(patch) => editor.updateRow(row.id, patch)}
            onRemove={() => editor.removeRow(row.id)}
            onReissue={() =>
              editor.writeCodes((latest) => reissueCode(latest, row.id), `${row.name} 코드를 재발급했습니다.`)
            }
          />
        ))}
        <TeamsSaveBar dirty={editor.dirty} saving={editor.saving} onSave={editor.saveTeams} onReset={editor.reset} />
      </CardContent>
      <TeamCodesPrintDialog open={printOpen} onOpenChange={setPrintOpen} teams={config.teams} codes={codes} />
    </Card>
  );
}

/**
 * 팀 편집 초안과 코드 저장 로직. 초안이 null이면 저장된 팀 목록을 그대로 보여줍니다.
 */
function useTeamsEditor({ hackathonId, config, members, secrets, updateCodes }: TeamsSectionProps) {
  const [draft, setDraft] = useState<TeamDraft[] | null>(null);
  const [saving, setSaving] = useState(false);
  const rows = draft ?? toTeamDrafts(config.teams);
  const codes = secrets?.codes ?? {};
  const canWriteCodes = secrets !== null && secrets !== undefined;

  const writeCodes = async (updater: CodesUpdater, message: string) => {
    if (!canWriteCodes) {
      toast.error("코드를 불러오지 못해 저장할 수 없습니다. 새로고침해 주세요.");
      return;
    }
    try {
      await updateCodes(updater);
      toast.success(message);
    } catch (error) {
      console.error("[hackathon-admin] saveSecrets", error);
      toast.error("코드 저장에 실패했습니다.");
    }
  };

  const saveTeams = async () => {
    const invalid = validateTeamDrafts(rows);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setSaving(true);
    const teams = draftsToTeams(rows, config.teams, members);
    const ok = await saveConfigPatch(hackathonId, { teams }, "팀 구성을 저장했습니다.");
    if (ok) {
      setDraft(null);
      if (canWriteCodes && !sameCodes(syncCodesWithTeams(codes, teams), codes)) {
        await writeCodes((latest) => syncCodesWithTeams(latest, teams), "팀 제출 코드를 갱신했습니다.");
      }
    }
    setSaving(false);
  };

  return {
    rows,
    codes,
    canWriteCodes,
    saving,
    dirty: draft !== null,
    reset: () => setDraft(null),
    addRow: () => setDraft([...rows, { ...nextTeamIdentity(rows), membersText: "" }]),
    removeRow: (id: string) => setDraft(rows.filter((row) => row.id !== id)),
    updateRow: (id: string, patch: Partial<TeamDraft>) =>
      setDraft(rows.map((row) => (row.id === id ? { ...row, ...patch } : row))),
    writeCodes,
    saveTeams,
  };
}

/** 삭제된 팀의 코드를 지우고 새 팀의 코드를 발급한 새 코드 표 */
function syncCodesWithTeams(
  codes: Readonly<Record<string, string>>,
  teams: readonly HackathonTeam[]
): Record<string, string> {
  const kept = Object.fromEntries(
    Object.entries(codes).filter(([teamId]) => teams.some((team) => team.id === teamId))
  );
  return fillMissingCodes(kept, teams);
}

function sameCodes(a: Readonly<Record<string, string>>, b: Readonly<Record<string, string>>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

function SecretsStatus(props: { secrets: HackathonSecrets | null | undefined; onReload: () => Promise<void> }) {
  if (props.secrets === undefined) return <p className="text-sm text-muted-foreground">코드 불러오는 중…</p>;
  return (
    <div className="flex items-center gap-2 text-sm">
      {props.secrets === null ? (
        <span className="text-destructive">코드를 불러오지 못했습니다.</span>
      ) : (
        <span className="text-muted-foreground">코드는 실시간 반영되지 않습니다. 다른 곳에서 바꿨다면 다시 불러오세요.</span>
      )}
      <Button size="sm" variant="ghost" onClick={() => void props.onReload()}>
        <RotateCw className="mr-1 h-3.5 w-3.5" /> 코드 다시 불러오기
      </Button>
    </div>
  );
}

function TeamsSaveBar(props: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t pt-3">
      {props.dirty && <span className="text-sm text-amber-700">저장하지 않은 변경 사항이 있습니다.</span>}
      <Button variant="ghost" onClick={props.onReset} disabled={!props.dirty || props.saving}>
        되돌리기
      </Button>
      <Button onClick={props.onSave} disabled={!props.dirty || props.saving}>
        {props.saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
        팀 구성 저장
      </Button>
    </div>
  );
}
