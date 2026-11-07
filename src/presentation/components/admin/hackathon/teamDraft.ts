import type { HackathonTeam } from "@/domain/hackathon/types";
import { resolveMembersText, type MemberCandidate } from "./hackathonAdminUtils";

/** 팀 편집 초안 (팀원은 쉼표 문자열로 편집) */
export interface TeamDraft {
  id: string;
  name: string;
  membersText: string;
}

/**
 * 저장된 팀 목록을 편집 초안으로 바꿉니다.
 *
 * @param {readonly HackathonTeam[]} teams - 저장된 팀 목록
 * @returns {TeamDraft[]} 편집 초안
 */
export function toTeamDrafts(teams: readonly HackathonTeam[]): TeamDraft[] {
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    membersText: team.members.map((member) => member.name).join(", "),
  }));
}

/**
 * 편집 초안을 검증합니다. 팀 이름은 비어 있거나 중복될 수 없습니다.
 *
 * @param {readonly TeamDraft[]} drafts - 편집 초안
 * @returns {string | null} 오류 메시지, 없으면 null
 */
export function validateTeamDrafts(drafts: readonly TeamDraft[]): string | null {
  const names = drafts.map((draft) => draft.name.trim());
  if (names.some((name) => !name)) return "팀 이름을 비워둘 수 없습니다.";
  if (new Set(names).size !== names.length) return "팀 이름이 중복되었습니다.";
  return null;
}

/**
 * 편집 초안을 저장용 팀 목록으로 바꿉니다. 기존 팀원의 memberId는 이름이 같으면 유지됩니다.
 *
 * @param {readonly TeamDraft[]} drafts - 편집 초안
 * @param {readonly HackathonTeam[]} saved - 저장된 팀 목록
 * @param {readonly MemberCandidate[]} members - 회원 목록
 * @returns {HackathonTeam[]} 저장할 팀 목록
 */
export function draftsToTeams(
  drafts: readonly TeamDraft[],
  saved: readonly HackathonTeam[],
  members: readonly MemberCandidate[]
): HackathonTeam[] {
  return drafts.map((draft) => {
    const previous = saved.find((team) => team.id === draft.id)?.members ?? [];
    const resolved = resolveMembersText(draft.membersText, previous, members);
    return {
      id: draft.id,
      name: draft.name.trim(),
      members: resolved.map(({ memberId, name }) => ({ memberId, name })),
    };
  });
}
