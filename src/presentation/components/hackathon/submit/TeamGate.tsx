"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HackathonSubmission, HackathonTeam } from "@/domain/hackathon/types";
import { cn } from "@/lib/utils";
import { verifyTeam, type TeamAuth } from "./submitApi";

const CODE_LENGTH = 4;

interface TeamGateProps {
  teams: readonly HackathonTeam[];
  onVerified: (auth: TeamAuth, submission: HackathonSubmission | null) => void;
}

interface TeamButtonProps {
  team: HackathonTeam;
  isSelected: boolean;
  onSelect: (teamId: string) => void;
}

function TeamButton({ team, isSelected, onSelect }: TeamButtonProps) {
  const memberNames = team.members.map((member) => member.name).join(" · ");
  return (
    <button
      type="button"
      onClick={() => onSelect(team.id)}
      aria-pressed={isSelected}
      className={cn(
        "rounded-xl border-2 p-3 text-left transition-colors outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-green-1/40",
        isSelected
          ? "border-green-1 bg-green-9/25"
          : "border-gray-5 bg-white hover:border-green-8 active:bg-gray-6"
      )}
    >
      <span className={cn("block text-base font-bold", isSelected && "text-green-1")}>
        {team.name}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-gray-1">
        {memberNames || "팀원 미정"}
      </span>
    </button>
  );
}

/**
 * 1단계: 팀 선택 + 4자리 팀 코드 확인.
 */
export function TeamGate({ teams, onVerified }: TeamGateProps) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = teamId != null && code.length === CODE_LENGTH && !isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!teamId || code.length !== CODE_LENGTH) return;
    setIsPending(true);
    setError(null);
    const auth = { teamId, code };
    const result = await verifyTeam(auth);
    setIsPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onVerified(auth, result.data.submission);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-semibold text-gray-black">우리 팀을 선택해 주세요</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {teams.map((team) => (
            <TeamButton key={team.id} team={team} isSelected={team.id === teamId} onSelect={setTeamId} />
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="team-code" className="text-sm font-semibold">
          팀 코드 (4자리)
        </Label>
        <Input
          id="team-code"
          inputMode="numeric"
          autoComplete="off"
          maxLength={CODE_LENGTH}
          placeholder="0000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          aria-invalid={error != null}
          aria-describedby="team-code-hint"
          className="h-12 max-w-40 text-center font-mono text-xl tracking-[0.5em]"
        />
        <p id="team-code-hint" className="text-xs text-gray-1">
          팀 코드는 운영진이 팀별로 나눠 드려요.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!canSubmit}>
        {isPending && <Loader2 className="animate-spin" aria-hidden />}
        {isPending ? "확인 중…" : "팀 확인하고 시작하기"}
      </Button>
    </form>
  );
}
