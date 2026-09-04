import { doc, getDoc } from "firebase/firestore";
import { db, COLLECTIONS, DOCUMENT_IDS } from "@/infrastructure/firebase";
import type { CheckinConfig } from "@/domain/entities";

/**
 * 라운지 QR 체크인 설정 Repository (읽기 전용)
 *
 * `checkinConfig/current` 단일 문서를 읽어
 * 현재 어떤 회차의 체크인이 열려 있는지 확인합니다.
 */
export class CheckinConfigRepository {
  /**
   * 현재 체크인 설정을 조회합니다.
   *
   * @returns {Promise<CheckinConfig | null>} 설정 문서. 없으면 null(=체크인 닫힘으로 간주)
   */
  async getCurrent(): Promise<CheckinConfig | null> {
    try {
      const ref = doc(
        db,
        COLLECTIONS.CHECKIN_CONFIG,
        DOCUMENT_IDS.CHECKIN_CONFIG_CURRENT
      );
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      return snapshot.data() as CheckinConfig;
    } catch (error) {
      console.error("Failed to fetch checkin config:", error);
      return null;
    }
  }
}

export const checkinConfigRepository = new CheckinConfigRepository();
