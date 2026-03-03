import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS, DOCUMENT_IDS } from "@/infrastructure/firebase";
import type { SiteConfig } from "@/domain/entities";

/**
 * 사이트 정보 설정 관리자 Repository
 * 조회는 기존 siteConfigRepository 사용
 */
export class SiteConfigAdminRepository {
  /**
   * 사이트 정보 설정 업데이트
   */
  async updateSiteConfig(
    data: Omit<SiteConfig, "updatedAt">
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SITE_CONFIG, DOCUMENT_IDS.SITE_CONFIG_MAIN);
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export const siteConfigAdminRepository = new SiteConfigAdminRepository();
