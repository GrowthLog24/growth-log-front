import {
  collection,
  doc,
  setDoc,
  getDocs,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { MonthlySchedule } from "@/domain/entities";
import { DEFAULT_MONTHLY_SCHEDULES } from "../monthlyScheduleRepository";

/**
 * 월별 일정 관리자 Repository
 */
export class MonthlyScheduleAdminRepository {
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

  /**
   * 월별 일정 업데이트 (전체 저장)
   */
  async updateSchedules(schedules: MonthlySchedule[]): Promise<void> {
    const batch = writeBatch(db);

    for (const schedule of schedules) {
      const docRef = doc(this.schedulesRef, String(schedule.phase));
      batch.set(docRef, {
        phase: schedule.phase,
        months: schedule.months,
        activities: schedule.activities,
      });
    }

    await batch.commit();
  }

  /**
   * 단일 월별 일정 업데이트
   */
  async updateSchedule(schedule: MonthlySchedule): Promise<void> {
    const docRef = doc(this.schedulesRef, String(schedule.phase));
    await setDoc(docRef, {
      phase: schedule.phase,
      months: schedule.months,
      activities: schedule.activities,
    });
  }

  /**
   * 기본값으로 초기화
   */
  async initializeDefaults(): Promise<void> {
    await this.updateSchedules(DEFAULT_MONTHLY_SCHEDULES);
  }
}

export const monthlyScheduleAdminRepository = new MonthlyScheduleAdminRepository();
