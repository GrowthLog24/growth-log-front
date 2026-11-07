import type {
  HackathonSubmission,
  HackathonSubmissionInput,
  HackathonTeam,
} from "@/domain/hackathon/types";

/** 마감(endAt) 이후 지각 제출을 받아주는 유예 시간: 15분 */
export const HACKATHON_LATE_GRACE_MS = 15 * 60 * 1000;

/** 유예 시간까지 지난 뒤 제출 거부 시 안내 문구 */
export const SUBMISSION_CLOSED_MESSAGE =
  "제출이 마감되었습니다. 운영진에게 문의해 주세요";

/**
 * 유예 시간까지 지나 제출이 완전히 닫혔는지 판정합니다.
 *
 * @param {number} now - 현재 시각 (epoch ms)
 * @param {number} endAt - 제출 마감 시각 (epoch ms)
 * @returns {boolean} endAt + 15분을 넘겼으면 true
 */
export function isSubmissionClosed(now: number, endAt: number): boolean {
  return now > endAt + HACKATHON_LATE_GRACE_MS;
}

/**
 * 저장할 제출 문서를 만듭니다. 기존 제출이 있으면 최초 제출 시각을 유지하고 횟수를 올립니다.
 *
 * @param {object} params - 행사 ID, 팀, 정규화된 입력, 기존 제출, 현재 시각, 마감 시각
 * @returns {Omit<HackathonSubmission, "id">} 저장할 제출 문서 (id 제외)
 *
 * @example
 * buildSubmissionRecord({ hackathonId, team, input, existing: null, now, endAt });
 * // => { ...input, submitCount: 1, firstSubmittedAt: now, isLate: false, ... }
 */
export function buildSubmissionRecord(params: {
  hackathonId: string;
  team: Pick<HackathonTeam, "id" | "name">;
  input: HackathonSubmissionInput;
  existing: HackathonSubmission | null;
  now: number;
  endAt: number;
}): Omit<HackathonSubmission, "id"> {
  const { hackathonId, team, input, existing, now, endAt } = params;
  return {
    ...input,
    hackathonId,
    teamId: team.id,
    teamName: team.name,
    firstSubmittedAt: existing?.firstSubmittedAt ?? now,
    submittedAt: now,
    submitCount: (existing?.submitCount ?? 0) + 1,
    isLate: now > endAt,
  };
}
