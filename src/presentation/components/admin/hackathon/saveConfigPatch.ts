import { toast } from "sonner";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";
import type { Hackathon } from "@/domain/hackathon/types";

/**
 * 행사 설정 일부를 저장하고 결과를 토스트로 알립니다.
 *
 * @param {string} hackathonId - 행사 ID
 * @param {Partial<Omit<Hackathon, "id">>} patch - 병합 저장할 필드
 * @param {string} successMessage - 성공 시 안내 문구
 * @returns {Promise<boolean>} 성공 여부
 */
export async function saveConfigPatch(
  hackathonId: string,
  patch: Partial<Omit<Hackathon, "id">>,
  successMessage: string
): Promise<boolean> {
  try {
    await hackathonRepository.saveConfig(hackathonId, patch);
    toast.success(successMessage);
    return true;
  } catch (error) {
    console.error("[hackathon-admin] saveConfig", error);
    toast.error("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    return false;
  }
}
