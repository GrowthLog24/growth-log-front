import { collection, getDocs } from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Meeting } from "@/domain/entities";

/**
 * 정기모임 회차 Repository (읽기 전용)
 */
export class MeetingRepository {
  private collectionRef = collection(db, COLLECTIONS.MEETINGS);

  /**
   * 회원이 참여 대상인 정기모임 회차 목록 조회 (집계 대상만, 회차 오름차순)
   *
   * 이전 기수에 가입한 정회원도 현재 기수 정기모임에 참석하므로,
   * 가입 기수 이상의 모든 회차를 대상으로 봅니다.
   * (가입 이전 기수의 회차는 참석할 수 없었으므로 제외합니다)
   *
   * 회차 수가 많지 않아 전체를 읽고 걸러냅니다.
   * 기수 범위 조건을 쿼리에 넣으면 복합 색인을 추가로 배포해야 합니다.
   *
   * @param {number} generation - 회원의 가입 기수
   * @returns {Promise<Meeting[]>} 회차 오름차순 목록
   */
  async getFromGeneration(generation: number): Promise<Meeting[]> {
    try {
      const snapshot = await getDocs(this.collectionRef);
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Meeting)
        .filter(
          (meeting) => meeting.isActive && meeting.generation >= generation
        )
        .sort((a, b) => a.generation - b.generation || a.round - b.round);
    } catch (error) {
      console.error(`Failed to fetch meetings from generation ${generation}:`, error);
      return [];
    }
  }
}

export const meetingRepository = new MeetingRepository();
