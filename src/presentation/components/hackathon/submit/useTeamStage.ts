"use client";

import { useEffect, useState } from "react";
import type { HackathonSubmission } from "@/domain/hackathon/types";
import { verifyTeam, type TeamAuth } from "./submitApi";
import { clearTeamSession, loadTeamSession, saveTeamSession } from "./teamSession";

/** 제출 화면 단계 */
export type TeamStage =
  | { kind: "restoring" }
  | { kind: "gate"; notice: string | null }
  | { kind: "form"; auth: TeamAuth; initial: HackathonSubmission | null }
  | { kind: "done"; auth: TeamAuth; submission: HackathonSubmission };

function stageAfterVerify(auth: TeamAuth, submission: HackathonSubmission | null): TeamStage {
  return submission ? { kind: "done", auth, submission } : { kind: "form", auth, initial: null };
}

const RESTORE_FAILED = "저장된 팀 정보를 확인하지 못했어요. 팀 코드를 다시 입력해 주세요.";
const AUTH_EXPIRED = "팀 코드가 확인되지 않아요. 다시 입력해 주세요.";

/**
 * 팀 확인 → 작성 → 완료 단계를 관리합니다. 새로고침해도 sessionStorage로 팀을 복원합니다.
 *
 * @returns 현재 단계와 단계 전환 핸들러
 */
export function useTeamStage() {
  const [stage, setStage] = useState<TeamStage>({ kind: "restoring" });

  useEffect(() => {
    let isActive = true;
    const restore = async () => {
      const saved = loadTeamSession();
      if (!saved) {
        setStage({ kind: "gate", notice: null });
        return;
      }
      const result = await verifyTeam(saved);
      if (!isActive) return;
      if (result.ok) {
        setStage(stageAfterVerify(saved, result.data.submission));
        return;
      }
      clearTeamSession();
      setStage({ kind: "gate", notice: RESTORE_FAILED });
    };
    void restore();
    return () => {
      isActive = false;
    };
  }, []);

  const handleVerified = (auth: TeamAuth, submission: HackathonSubmission | null) => {
    saveTeamSession(auth);
    setStage(stageAfterVerify(auth, submission));
  };

  const handleSubmitted = (auth: TeamAuth, submission: HackathonSubmission) => {
    setStage({ kind: "done", auth, submission });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (auth: TeamAuth, submission: HackathonSubmission) => {
    setStage({ kind: "form", auth, initial: submission });
  };

  const changeTeam = (notice: string | null = null) => {
    clearTeamSession();
    setStage({ kind: "gate", notice });
  };

  const handleAuthExpired = () => changeTeam(AUTH_EXPIRED);

  return { stage, handleVerified, handleSubmitted, handleEdit, changeTeam, handleAuthExpired };
}
