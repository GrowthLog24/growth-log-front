import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { MonthlySchedule } from "@/domain/entities";

/**
 * 월별 일정 기본값
 * phase 0~6: 개월차 (6개월 주기), 7: 정기 프로그램
 */
export const DEFAULT_MONTHLY_SCHEDULES: MonthlySchedule[] = [
  { phase: 0, months: "2월, 8월", activities: [] },
  { phase: 1, months: "3월, 9월", activities: [] },
  { phase: 2, months: "4월, 10월", activities: [] },
  { phase: 3, months: "5월, 11월", activities: [] },
  { phase: 4, months: "6월, 12월", activities: [] },
  { phase: 5, months: "7월, 1월", activities: [] },
  { phase: 6, months: "8월, 2월", activities: [] },
  { phase: 7, months: "All", activities: [] },
];

/**
 * 월별 일정 Repository
 */
export class MonthlyScheduleRepository {
  private schedulesRef = collection(db, COLLECTIONS.MONTHLY_SCHEDULES);

  /**
   * 모든 월별 일정 조회
   */
  async getSchedules(): Promise<MonthlySchedule[]> {
    try {
      const q = query(this.schedulesRef, orderBy("phase", "asc"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return DEFAULT_MONTHLY_SCHEDULES;
      }

      return snapshot.docs.map((doc) => ({
        phase: doc.data().phase,
        months: doc.data().months,
        activities: doc.data().activities || [],
      }));
    } catch (error) {
      console.error("Failed to fetch monthly schedules:", error);
      return DEFAULT_MONTHLY_SCHEDULES;
    }
  }
}

export const monthlyScheduleRepository = new MonthlyScheduleRepository();
