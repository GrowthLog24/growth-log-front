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
 * 회원 기준 출결 저장 입력값
 */
export interface MemberAttendanceInput {
  meetingId: string;
  generation: number;
  round: number;
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
   * 특정 회원의 전체 출결 기록 조회
   */
  async getByMemberId(memberId: string): Promise<Attendance[]> {
    const q = query(this.collectionRef, where("memberId", "==", memberId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Attendance[];
  }

  /**
   * 한 회원의 여러 회차 출결을 일괄 저장합니다.
   *
   * 회차 단위(saveMany)와 반대 방향으로, 회원 상세 화면에서
   * 그 회원의 전체 회차를 한 번에 입력할 때 사용합니다.
   *
   * @param {string} memberId - 회원 문서 ID
   * @param {readonly MemberAttendanceInput[]} inputs - 회차별 출결 상태
   */
  async saveManyForMember(
    memberId: string,
    inputs: readonly MemberAttendanceInput[]
  ): Promise<void> {
    if (inputs.length === 0) return;

    const batch = writeBatch(db);

    for (const input of inputs) {
      const docRef = doc(
        this.collectionRef,
        buildAttendanceId(input.meetingId, memberId)
      );

      // 결석은 문서를 남기지 않습니다. (기록 없음 = 결석으로 집계)
      if (input.status === "absent") {
        batch.delete(docRef);
        continue;
      }

      batch.set(
        docRef,
        {
          meetingId: input.meetingId,
          memberId,
          generation: input.generation,
          round: input.round,
          status: input.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
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
