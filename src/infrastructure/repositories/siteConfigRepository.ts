import { doc, getDoc } from "firebase/firestore";
import { db, COLLECTIONS, DOCUMENT_IDS } from "@/infrastructure/firebase";
import type { ISiteConfigRepository, IStatsRepository } from "@/domain/repositories";
import type { SiteConfig, Stats } from "@/domain/entities";

/**
 * 사이트 정보 설정 Repository Firestore 구현체
 */
export class SiteConfigRepository implements ISiteConfigRepository {
  async getSiteConfig(): Promise<SiteConfig | null> {
    try {
      const docRef = doc(db, COLLECTIONS.SITE_CONFIG, DOCUMENT_IDS.SITE_CONFIG_MAIN);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as SiteConfig;
    } catch (error) {
      console.error("Failed to fetch site config:", error);
      return null;
    }
  }
}

/**
 * 통계 Repository Firestore 구현체
 */
export class StatsRepository implements IStatsRepository {
  async getStats(): Promise<Stats | null> {
    try {
      const docRef = doc(db, COLLECTIONS.STATS, DOCUMENT_IDS.STATS_MAIN);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as Stats;
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      return null;
    }
  }
}

export const siteConfigRepository = new SiteConfigRepository();
export const statsRepository = new StatsRepository();
