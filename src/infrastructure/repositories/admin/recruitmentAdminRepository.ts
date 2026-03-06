import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS, DOCUMENT_IDS, getSubCollection } from "@/infrastructure/firebase";
import type { SiteConfig, PreRegistration, PreRegistrationField, Recruitment, OTSchedule } from "@/domain/entities";

/**
 * 모집/사전신청 통합 관리자 Repository
 */
export class RecruitmentAdminRepository {
  private preRegistrationsRef = collection(db, COLLECTIONS.PRE_REGISTRATIONS);
  private formFieldsRef = collection(db, COLLECTIONS.PRE_REGISTRATION_FORM_FIELDS);
  private siteConfigRef = doc(db, COLLECTIONS.SITE_CONFIG, DOCUMENT_IDS.SITE_CONFIG_MAIN);

  // ==================== 모집 설정 ====================

  /**
   * 모집 설정 조회
   */
  async getRecruitmentSettings(): Promise<{
    isOpen: boolean;
    generation: number;
    formLink: string;
    currentGeneration: number;
  } | null> {
    const snapshot = await getDoc(this.siteConfigRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data() as SiteConfig;
    return {
      isOpen: data.isRecruitmentOpen ?? false,
      generation: data.recruitmentGeneration ?? data.currentGeneration + 1,
      formLink: data.recruitmentFormLink ?? "",
      currentGeneration: data.currentGeneration,
    };
  }

  /**
   * 모집 활성화 (새 기수 모집 시작)
   */
  async openRecruitment(generation: number, formLink: string): Promise<void> {
    await updateDoc(this.siteConfigRef, {
      isRecruitmentOpen: true,
      recruitmentGeneration: generation,
      recruitmentFormLink: formLink,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 모집 비활성화
   */
  async closeRecruitment(): Promise<void> {
    await updateDoc(this.siteConfigRef, {
      isRecruitmentOpen: false,
      updatedAt: serverTimestamp(),
    });
  }

  // ==================== 모집 상세 정보 ====================

  /**
   * 모집 상세 정보 조회
   */
  async getRecruitmentDetail(generation: number): Promise<Recruitment | null> {
    const docRef = doc(db, COLLECTIONS.RECRUITMENTS, String(generation));
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    // OT 일정 가져오기
    const otSchedulesRef = collection(db, getSubCollection.otSchedules(generation));
    const otQuery = query(otSchedulesRef, orderBy("round", "asc"));
    const otSnapshot = await getDocs(otQuery);
    const otSchedules = otSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OTSchedule[];

    return {
      id: snapshot.id,
      ...data,
      otSchedules,
    } as Recruitment;
  }

  /**
   * 모집 상세 정보 저장/수정
   */
  async saveRecruitmentDetail(
    generation: number,
    data: {
      // 섹션 1: 신입회원 가입 안내
      deadlineAt?: Date;
      applyGuideMd?: string;
      // 섹션 2: OT 안내
      otLocationMd?: string;
      otGuideMd?: string;
      // 섹션 3: 등록 입금 안내
      feeAmount?: number;
      feeDetailMd?: string;
      bankAccountText?: string;
      feeDescriptionMd?: string;
      // 섹션 4: 정기 모임 안내
      firstMeetingAt?: Date;
      regularMeetingsMd?: string;
      activityScheduleMd?: string;
      meetingGuideMd?: string;
      // 기타
      contactPhone?: string;
      contactEmail?: string;
      kakaoMessageTemplate?: string;
    }
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.RECRUITMENTS, String(generation));

    const updateData: Record<string, unknown> = {
      generation,
      updatedAt: serverTimestamp(),
    };

    // 섹션 1: 신입회원 가입 안내
    if (data.deadlineAt) {
      updateData.deadlineAt = Timestamp.fromDate(data.deadlineAt);
    }
    if (data.applyGuideMd !== undefined) {
      updateData.applyGuideMd = data.applyGuideMd;
    }

    // 섹션 2: OT 안내
    if (data.otLocationMd !== undefined) {
      updateData.otLocationMd = data.otLocationMd;
    }
    if (data.otGuideMd !== undefined) {
      updateData.otGuideMd = data.otGuideMd;
    }

    // 섹션 3: 등록 입금 안내
    if (data.feeAmount !== undefined) {
      updateData.feeAmount = data.feeAmount;
    }
    if (data.feeDetailMd !== undefined) {
      updateData.feeDetailMd = data.feeDetailMd;
    }
    if (data.bankAccountText !== undefined) {
      updateData.bankAccountText = data.bankAccountText;
    }
    if (data.feeDescriptionMd !== undefined) {
      updateData.feeDescriptionMd = data.feeDescriptionMd;
    }

    // 섹션 4: 정기 모임 안내
    if (data.firstMeetingAt) {
      updateData.firstMeetingAt = Timestamp.fromDate(data.firstMeetingAt);
    }
    if (data.regularMeetingsMd !== undefined) {
      updateData.regularMeetingsMd = data.regularMeetingsMd;
    }
    if (data.activityScheduleMd !== undefined) {
      updateData.activityScheduleMd = data.activityScheduleMd;
    }
    if (data.meetingGuideMd !== undefined) {
      updateData.meetingGuideMd = data.meetingGuideMd;
    }

    // 기타
    if (data.contactPhone !== undefined) {
      updateData.contactPhone = data.contactPhone;
    }
    if (data.contactEmail !== undefined) {
      updateData.contactEmail = data.contactEmail;
    }
    if (data.kakaoMessageTemplate !== undefined) {
      updateData.kakaoMessageTemplate = data.kakaoMessageTemplate;
    }

    await setDoc(docRef, updateData, { merge: true });
  }

  /**
   * OT 일정 추가
   */
  async addOTSchedule(
    generation: number,
    data: {
      round: number;
      dateAt: Date;
      timeText: string;
      locationText: string;
      note?: string;
    }
  ): Promise<string> {
    const otSchedulesRef = collection(db, getSubCollection.otSchedules(generation));
    const docRef = await addDoc(otSchedulesRef, {
      round: data.round,
      dateAt: Timestamp.fromDate(data.dateAt),
      timeText: data.timeText,
      locationText: data.locationText,
      note: data.note || "",
    });
    return docRef.id;
  }

  /**
   * OT 일정 수정
   */
  async updateOTSchedule(
    generation: number,
    otId: string,
    data: {
      round?: number;
      dateAt?: Date;
      timeText?: string;
      locationText?: string;
      note?: string;
    }
  ): Promise<void> {
    const docRef = doc(db, getSubCollection.otSchedules(generation), otId);
    const updateData: Record<string, unknown> = {};

    if (data.round !== undefined) updateData.round = data.round;
    if (data.dateAt) updateData.dateAt = Timestamp.fromDate(data.dateAt);
    if (data.timeText !== undefined) updateData.timeText = data.timeText;
    if (data.locationText !== undefined) updateData.locationText = data.locationText;
    if (data.note !== undefined) updateData.note = data.note;

    await updateDoc(docRef, updateData);
  }

  /**
   * OT 일정 삭제
   */
  async deleteOTSchedule(generation: number, otId: string): Promise<void> {
    const docRef = doc(db, getSubCollection.otSchedules(generation), otId);
    await deleteDoc(docRef);
  }

  // ==================== 사전등록 신청 ====================

  /**
   * 사전등록 신청자 목록 조회
   */
  async getPreRegistrations(filters?: {
    generation?: number;
    search?: string;
    sortBy?: "submittedAt" | "name";
    sortOrder?: "asc" | "desc";
  }): Promise<PreRegistration[]> {
    let q = query(this.preRegistrationsRef);

    // 기수 필터
    if (filters?.generation) {
      q = query(q, where("generation", "==", filters.generation));
    }

    // 기본 정렬
    const sortField = filters?.sortBy || "submittedAt";
    const sortDirection = filters?.sortOrder || "desc";
    q = query(q, orderBy(sortField, sortDirection));

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PreRegistration[];

    // 클라이언트 사이드 검색 (이름)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter((r) =>
        r.name.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  /**
   * 기수별 사전등록 신청자 수 조회
   */
  async getPreRegistrationCountByGeneration(generation: number): Promise<number> {
    const q = query(
      this.preRegistrationsRef,
      where("generation", "==", generation)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * 다음 순번 조회
   */
  async getNextSeq(): Promise<number> {
    const q = query(
      this.preRegistrationsRef,
      orderBy("seq", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 1;
    const lastDoc = snapshot.docs[0].data() as PreRegistration;
    return (lastDoc.seq || 0) + 1;
  }

  /**
   * 사전등록 신청 추가 (순차적 seq 자동 할당)
   */
  async addPreRegistration(data: {
    generation: number;
    name: string;
    formData: Record<string, string>;
  }): Promise<string> {
    const nextSeq = await this.getNextSeq();

    const docRef = await addDoc(this.preRegistrationsRef, {
      seq: nextSeq,
      generation: data.generation,
      name: data.name,
      formData: data.formData,
      submittedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * 사전등록 신청 삭제
   */
  async deletePreRegistration(id: string): Promise<void> {
    const docRef = doc(this.preRegistrationsRef, id);
    await deleteDoc(docRef);
  }

  /**
   * 전체 기수 목록 조회 (필터용)
   */
  async getAvailableGenerations(): Promise<number[]> {
    const snapshot = await getDocs(this.preRegistrationsRef);
    const generations = new Set<number>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as PreRegistration;
      if (data.generation) {
        generations.add(data.generation);
      }
    });
    return Array.from(generations).sort((a, b) => b - a);
  }

  // ==================== 사전등록 신청 폼 필드 ====================

  /**
   * 폼 필드 목록 조회
   */
  async getPreRegistrationFormFields(): Promise<PreRegistrationField[]> {
    const q = query(this.formFieldsRef, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PreRegistrationField[];
  }

  /**
   * 폼 필드 조회
   */
  async getPreRegistrationFormField(id: string): Promise<PreRegistrationField | null> {
    const docRef = doc(this.formFieldsRef, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as PreRegistrationField;
  }

  /**
   * 폼 필드 추가
   */
  async addPreRegistrationFormField(data: Omit<PreRegistrationField, "id">): Promise<string> {
    // undefined 값 제거 (Firestore는 undefined를 허용하지 않음)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    const docRef = await addDoc(this.formFieldsRef, cleanData);
    return docRef.id;
  }

  /**
   * 폼 필드 수정
   */
  async updatePreRegistrationFormField(id: string, data: Partial<Omit<PreRegistrationField, "id">>): Promise<void> {
    // undefined 값 제거 (Firestore는 undefined를 허용하지 않음)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    const docRef = doc(this.formFieldsRef, id);
    await updateDoc(docRef, cleanData);
  }

  /**
   * 폼 필드 삭제
   */
  async deletePreRegistrationFormField(id: string): Promise<void> {
    const docRef = doc(this.formFieldsRef, id);
    await deleteDoc(docRef);
  }

  /**
   * 폼 필드 순서 일괄 변경
   */
  async updatePreRegistrationFormFieldsOrder(fieldOrders: { id: string; order: number }[]): Promise<void> {
    await Promise.all(
      fieldOrders.map(({ id, order }) => {
        const docRef = doc(this.formFieldsRef, id);
        return updateDoc(docRef, { order });
      })
    );
  }
}

export const recruitmentAdminRepository = new RecruitmentAdminRepository();
