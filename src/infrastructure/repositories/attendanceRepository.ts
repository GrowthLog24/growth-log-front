import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Attendance, AttendanceStatus } from "@/domain/entities";

/**
 * 출결 기록 Repository (읽기 전용)
 */
export class AttendanceRepository {
  private collectionRef = collection(db, COLLECTIONS.ATTENDANCES);

  /**
   * 특정 회차·회원의 출결 상태를 조회합니다.
   *
   * 문서 ID는 `${meetingId}_${memberId}` 규약을 따릅니다.
   * 기록이 없으면(=결석) null을 반환합니다.
   *
   * @param {string} meetingId - 회차 문서 ID
   * @param {string} memberId - 회원 문서 ID
   * @returns {Promise<AttendanceStatus | null>} 출결 상태. 기록 없으면 null
   */
  async getStatus(
    meetingId: string,
    memberId: string
  ): Promise<AttendanceStatus | null> {
    try {
      const snapshot = await getDoc(
        doc(this.collectionRef, `${meetingId}_${memberId}`)
      );
      if (!snapshot.exists()) return null;
      return (snapshot.data() as Attendance).status;
    } catch (error) {
      console.error(
        `Failed to fetch attendance status for ${meetingId}_${memberId}:`,
        error
      );
      return null;
    }
  }

  /**
   * 특정 회원의 전체 출결 기록 조회
   *
   * 정렬은 도메인 집계(summarizeAttendance)에서 회차 기준으로 수행하므로
   * 복합 색인이 필요한 orderBy를 쿼리에 포함하지 않습니다.
   */
  async getByMemberId(memberId: string): Promise<Attendance[]> {
    try {
      const q = query(this.collectionRef, where("memberId", "==", memberId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Attendance[];
    } catch (error) {
      console.error(`Failed to fetch attendances for member ${memberId}:`, error);
      return [];
    }
  }
}

export const attendanceRepository = new AttendanceRepository();
