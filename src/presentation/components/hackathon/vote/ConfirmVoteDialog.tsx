"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HackathonTeam } from "@/domain/hackathon/types";

interface ConfirmVoteDialogProps {
  open: boolean;
  /** 닫히는 애니메이션 중에도 이름이 유지되도록 마지막 선택 팀을 그대로 받는다 */
  team: HackathonTeam | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 투표 확정 전 확인 대화상자입니다. 제출 중에는 닫을 수 없습니다.
 *
 * @param {ConfirmVoteDialogProps} props - 열림 여부, 대상 팀, 제출 중 여부, 취소·확정 콜백
 * @returns {JSX.Element} 확인 대화상자
 */
export function ConfirmVoteDialog({
  open,
  team,
  isSubmitting,
  onCancel,
  onConfirm,
}: ConfirmVoteDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) onCancel();
  };

  return (
    <Dialog open={open && team !== null} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isSubmitting} className="max-w-[calc(100%-2rem)] rounded-3xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">{team?.name ?? "이 팀"}에 투표할까요?</DialogTitle>
          <DialogDescription>투표는 변경할 수 없어요.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="lg" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
          <Button size="lg" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "투표하는 중..." : "투표하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
