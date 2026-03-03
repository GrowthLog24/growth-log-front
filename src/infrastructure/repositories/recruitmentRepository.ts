import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS, getSubCollection } from "@/infrastructure/firebase";
import type { IRecruitmentRepository } from "@/domain/repositories";
import type { Recruitment, OTSchedule } from "@/domain/entities";
import { siteConfigRepository } from "./siteConfigRepository";

/**
 * 모집 Repository Firestore 구현체
 */
export class RecruitmentRepository implements IRecruitmentRepository {
  async getCurrentRecruitment(): Promise<Recruitment | null> {
    try {
      const siteConfig = await siteConfigRepository.getSiteConfig();
      if (!siteConfig) {
        return null;
      }

      return this.getRecruitmentByGeneration(siteConfig.currentGeneration);
    } catch (error) {
      console.error("Failed to fetch current recruitment:", error);
      return null;
    }
  }

  async getRecruitmentByGeneration(generation: number): Promise<Recruitment | null> {
    try {
      const docRef = doc(db, COLLECTIONS.RECRUITMENTS, String(generation));
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      const recruitment = {
        id: snapshot.id,
        ...snapshot.data(),
      } as Recruitment;

      // OT 일정 가져오기
      const otSchedulesRef = collection(
        db,
        getSubCollection.otSchedules(generation)
      );
      const otQuery = query(otSchedulesRef, orderBy("round", "asc"));
      const otSnapshot = await getDocs(otQuery);

      const otSchedules = otSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OTSchedule[];

      return {
        ...recruitment,
        otSchedules,
      };
    } catch (error) {
      console.error("Failed to fetch recruitment by generation:", error);
      return null;
    }
  }
}

export const recruitmentRepository = new RecruitmentRepository();
