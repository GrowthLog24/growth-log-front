"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HackathonTeam } from "@/domain/hackathon/types";
import { HACKATHON_SUBMIT_PATH } from "./hackathonAdminUtils";

/** 인쇄 영역 DOM id (인쇄 시 이 영역만 보이게 함) */
const PRINT_AREA_ID = "hackathon-code-print-area";

/** 인쇄 시 다이얼로그의 인쇄 영역만 남기는 스타일 */
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #${PRINT_AREA_ID}, #${PRINT_AREA_ID} * { visibility: visible !important; }
  [data-slot="dialog-content"] { position: absolute !important; inset: 0 !important; transform: none !important; max-height: none !important; overflow: visible !important; border: 0 !important; box-shadow: none !important; }
  #${PRINT_AREA_ID} { position: absolute; left: 0; top: 0; width: 100%; padding: 8mm; background: white; }
}`;

interface TeamCodesPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: readonly HackathonTeam[];
  codes: Readonly<Record<string, string>>;
}

/**
 * 팀별 제출 코드 카드 인쇄 화면 (팀 이름 + 코드 + 제출 URL)
 */
export function TeamCodesPrintDialog({ open, onOpenChange, teams, codes }: TeamCodesPrintDialogProps) {
  const submitUrl =
    typeof window === "undefined" ? HACKATHON_SUBMIT_PATH : `${window.location.origin}${HACKATHON_SUBMIT_PATH}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <style>{PRINT_STYLE}</style>
        <DialogHeader>
          <DialogTitle>코드 카드 인쇄</DialogTitle>
          <DialogDescription>저장된 팀 기준입니다. 잘라서 각 팀에 전달하세요.</DialogDescription>
        </DialogHeader>
        <div id={PRINT_AREA_ID} className="grid grid-cols-2 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="break-inside-avoid rounded-xl border-2 border-dashed border-black p-5 text-black">
              <p className="text-sm">100분 해커톤 제출 코드</p>
              <p className="mt-1 text-2xl font-bold">{team.name}</p>
              <p className="my-3 font-mono text-5xl font-black tracking-[0.3em]">{codes[team.id] ?? "----"}</p>
              <p className="text-xs">제출: {submitUrl}</p>
              <p className="text-xs">{team.members.map((member) => member.name).join(", ")}</p>
            </div>
          ))}
          {teams.length === 0 && <p className="text-sm text-muted-foreground">저장된 팀이 없습니다.</p>}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => window.print()} disabled={teams.length === 0}>
            <Printer className="mr-1 h-4 w-4" /> 인쇄
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
