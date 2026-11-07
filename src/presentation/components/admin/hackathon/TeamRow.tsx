"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/presentation/components/admin";
import type { Member } from "@/domain/entities";
import type { HackathonTeam } from "@/domain/hackathon/types";
import { resolveMembersText, type ResolvedMember } from "./hackathonAdminUtils";
import type { TeamDraft } from "./teamDraft";

interface TeamRowProps {
  draft: TeamDraft;
  /** 저장된 팀 (새로 추가해 아직 저장 전이면 undefined) */
  savedTeam: HackathonTeam | undefined;
  members: readonly Member[];
  code: string | undefined;
  hasSubmission: boolean;
  canWriteCodes: boolean;
  onChange: (patch: Partial<TeamDraft>) => void;
  onRemove: () => void;
  onReissue: () => Promise<void>;
}

/**
 * 팀 한 줄: 이름·팀원 편집, 회원 매칭 배지, 제출 코드와 재발급
 */
export function TeamRow(props: TeamRowProps) {
  const { draft, savedTeam, members, onChange } = props;
  const resolved = useMemo(
    () => resolveMembersText(draft.membersText, savedTeam?.members ?? [], members),
    [draft.membersText, savedTeam, members]
  );

  return (
    <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-[10rem_1fr_auto]">
      <div className="space-y-1">
        <p className="font-mono text-xs text-muted-foreground">{draft.id}</p>
        <Input
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
          aria-label="팀 이름"
        />
      </div>
      <div className="space-y-2">
        <Input
          value={draft.membersText}
          onChange={(event) => onChange({ membersText: event.target.value })}
          placeholder="팀원 이름을 쉼표로 구분 (예: 홍길동, 김철수)"
          aria-label="팀원"
        />
        <MemberBadges resolved={resolved} />
      </div>
      <TeamCodeActions {...props} />
    </div>
  );
}

function MemberBadges({ resolved }: { resolved: readonly ResolvedMember[] }) {
  const unmatched = resolved.filter((member) => member.match === "unmatched").length;
  if (resolved.length === 0) return <p className="text-xs text-muted-foreground">팀원 없음</p>;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {resolved.map((member, index) => (
        <Badge
          key={`${member.name}-${index}`}
          variant={member.match === "unmatched" ? "destructive" : "outline"}
          className={member.match === "ambiguous" ? "border-amber-400 text-amber-800" : undefined}
          title={matchTitle(member)}
        >
          {member.match !== "matched" && <AlertTriangle />}
          {member.name}
        </Badge>
      ))}
      {unmatched > 0 && (
        <span className="text-xs text-destructive">
          회원 매칭 실패 {unmatched}명 — 본인 팀 투표 차단이 동작하지 않습니다.
        </span>
      )}
    </div>
  );
}

function matchTitle(member: ResolvedMember): string {
  if (member.match === "unmatched") return "members 컬렉션에서 같은 이름을 찾지 못했습니다.";
  if (member.match === "ambiguous") return `동명이인 — 가입 중·최신 기수 회원으로 매칭 (${member.memberId})`;
  return `memberId: ${member.memberId}`;
}

function TeamCodeActions(props: TeamRowProps) {
  const [confirm, setConfirm] = useState<"reissue" | "remove" | null>(null);
  const [busy, setBusy] = useState(false);
  const isSaved = props.savedTeam !== undefined;

  const reissue = async () => {
    setBusy(true);
    await props.onReissue();
    setBusy(false);
    setConfirm(null);
  };

  const remove = () => {
    if (props.hasSubmission || isSaved) return setConfirm("remove");
    props.onRemove();
  };

  return (
    <div className="flex items-center gap-2 md:flex-col md:items-end">
      <div className="text-right">
        <p className="text-xs text-muted-foreground">제출 코드</p>
        <p className="font-mono text-2xl font-bold tracking-widest">
          {props.code ?? (isSaved ? "없음" : "저장 후 발급")}
        </p>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={!isSaved || !props.canWriteCodes || busy}
          onClick={() => (props.code ? setConfirm("reissue") : void reissue())}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> {props.code ? "재발급" : "발급"}
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} aria-label={`${props.draft.name} 삭제`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && !busy && setConfirm(null)}
        title={confirm === "reissue" ? `${props.draft.name} 코드 재발급` : `${props.draft.name} 삭제`}
        description={
          confirm === "reissue"
            ? "기존 코드는 즉시 사용할 수 없게 됩니다. 팀에 새 코드를 다시 전달해야 합니다."
            : `${props.hasSubmission ? "이 팀은 이미 제출물이 있습니다. " : ""}목록에서 제거한 뒤 '팀 구성 저장'을 눌러야 반영됩니다.`
        }
        confirmText={confirm === "reissue" ? "재발급" : "제거"}
        variant="destructive"
        loading={busy}
        onConfirm={() => {
          if (confirm === "reissue") return void reissue();
          props.onRemove();
          setConfirm(null);
        }}
      />
    </div>
  );
}
