import { toast } from "sonner";

/**
 * 텍스트를 클립보드에 복사하고 결과를 토스트로 알립니다.
 *
 * @param {string} text - 복사할 텍스트
 * @param {string} successMessage - 성공 시 안내 문구
 * @returns {Promise<boolean>} 성공 여부
 */
export async function copyToClipboard(text: string, successMessage: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch (error) {
    console.error("[hackathon-admin] clipboard", error);
    toast.error("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    return false;
  }
}
