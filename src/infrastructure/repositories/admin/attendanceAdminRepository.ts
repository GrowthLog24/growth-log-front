import {
  collection,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Attendance, AttendanceStatus } from "@/domain/entities";

/**
 * 출결 문서 ID 생성
 *
 * `${meetingId}_${memberId}` 조합을 문서 ID로 사용해
 * 같은 회차·회원의 중복 기록이 생기지 않도록 합니다.
 */
export function buildAttendanceId(meetingId: string, memberId: string): string {
  return `${meetingId}_${memberId}`;
}

/**
 * 출결 저장 입력값
 */
export interface AttendanceInput {
  memberId: string;
  status: AttendanceStatus;
}

/**
 * 출결 관리자 Repository
 */
export class AttendanceAdminRepository {
  private collectionRef = collection(db, COLLECTIONS.ATTENDANCES);

  /**
   * 특정 회차의 출결 기록 조회
   */
  async getByMeetingId(meetingId: string): Promise<Attendance[]> {
    const q = query(this.collectionRef, where("meetingId", "==", meetingId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Attendance[];
  }

  /**
   * 회차 출결을 일괄 저장합니다.
   *
   * 결석("absent")은 문서를 남기지 않고 삭제합니다.
   * 기록이 없는 회차는 도메인 집계에서 결석으로 처리되므로
   * 불필요한 문서를 쌓지 않기 위함입니다.
   *
   * @param {object} meeting - 회차 정보 (비정규화 필드 저장용)
   * @param {readonly AttendanceInput[]} inputs - 회원별 출결 상태
   */
  async saveMany(
    meeting: { id: string; generation: number; round: number },
    inputs: readonly AttendanceInput[]
  ): Promise<void> {
    if (inputs.length === 0) return;

    const batch = writeBatch(db);

    for (const input of inputs) {
      const docRef = doc(
        this.collectionRef,
        buildAttendanceId(meeting.id, input.memberId)
      );

      if (input.status === "absent") {
        batch.delete(docRef);
        continue;
      }

      batch.set(
        docRef,
        {
          meetingId: meeting.id,
          memberId: input.memberId,
          generation: meeting.generation,
          round: meeting.round,
          status: input.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
  }
}

export const attendanceAdminRepository = new AttendanceAdminRepository();
