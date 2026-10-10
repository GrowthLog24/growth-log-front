import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS, DOCUMENT_IDS } from "@/infrastructure/firebase";
import type { CheckinLocation } from "@/domain/entities";

/**
 * 라운지 QR 체크인 설정 관리자 Repository
 *
 * 운영자가 특정 정기모임 회차의 체크인을 열거나 닫을 때 사용합니다.
 * `checkinConfig/current` 단일 문서를 갱신합니다.
 */
export class CheckinConfigAdminRepository {
  /**
   * 현재 체크인 대상 회차와 개방 여부를 설정합니다.
   *
   * @param {string | null} meetingId - 체크인을 받을 회차 문서 ID (닫을 때는 null 가능)
   * @param {boolean} open - 체크인 개방 여부
   */
  async setCurrent(meetingId: string | null, open: boolean): Promise<void> {
    const ref = doc(
      db,
      COLLECTIONS.CHECKIN_CONFIG,
      DOCUMENT_IDS.CHECKIN_CONFIG_CURRENT
    );
    await setDoc(
      ref,
      {
        meetingId,
        open,
        ...(open ? { openedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * 체크인 허용 장소를 지정하거나(외부 모임) 기본값(강남구)으로 되돌립니다.
   *
   * @param {CheckinLocation | null} location - 지정 장소. null이면 강남구 기본 판정
   */
  async setLocation(location: CheckinLocation | null): Promise<void> {
    const ref = doc(
      db,
      COLLECTIONS.CHECKIN_CONFIG,
      DOCUMENT_IDS.CHECKIN_CONFIG_CURRENT
    );
    await setDoc(
      ref,
      { location, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

export const checkinConfigAdminRepository = new CheckinConfigAdminRepository();
