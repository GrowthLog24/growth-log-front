import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Meeting } from "@/domain/entities";

/**
 * 정기모임 회차 관리자 Repository
 */
export class MeetingAdminRepository {
  private collectionRef = collection(db, COLLECTIONS.MEETINGS);

  /**
   * 전체 회차 목록 조회 (기수 내림차순, 회차 내림차순)
   */
  async getAll(): Promise<Meeting[]> {
    const q = query(
      this.collectionRef,
      orderBy("generation", "desc"),
      orderBy("round", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Meeting[];
  }

  /**
   * 회차 추가
   */
  async create(data: {
    generation: number;
    round: number;
    title: string;
    meetingDate: Date;
    isActive: boolean;
  }): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      generation: data.generation,
      round: data.round,
      title: data.title,
      meetingDate: Timestamp.fromDate(data.meetingDate),
      isActive: data.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * 회차 수정
   *
   * 회차 번호가 바뀌면 해당 회차의 출결 기록에 비정규화된 round 값도
   * 함께 갱신해 집계가 어긋나지 않도록 합니다.
   */
  async update(
    id: string,
    data: {
      generation?: number;
      round?: number;
      title?: string;
      meetingDate?: Date;
      isActive?: boolean;
    }
  ): Promise<void> {
    const { meetingDate, ...rest } = data;
    await updateDoc(doc(this.collectionRef, id), {
      ...rest,
      ...(meetingDate ? { meetingDate: Timestamp.fromDate(meetingDate) } : {}),
      updatedAt: serverTimestamp(),
    });

    if (data.round !== undefined || data.generation !== undefined) {
      await this.syncAttendanceDenormalizedFields(id, {
        round: data.round,
        generation: data.generation,
      });
    }
  }

  /**
   * 회차 삭제 (연결된 출결 기록도 함께 삭제)
   */
  async delete(id: string): Promise<void> {
    const attendanceSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.ATTENDANCES), where("meetingId", "==", id))
    );

    const batch = writeBatch(db);
    for (const attendanceDoc of attendanceSnapshot.docs) {
      batch.delete(attendanceDoc.ref);
    }
    batch.delete(doc(this.collectionRef, id));
    await batch.commit();
  }

  /**
   * 출결 기록의 비정규화 필드(round, generation)를 회차 정보와 동기화합니다.
   */
  private async syncAttendanceDenormalizedFields(
    meetingId: string,
    fields: { round?: number; generation?: number }
  ): Promise<void> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ATTENDANCES),
        where("meetingId", "==", meetingId)
      )
    );
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    for (const attendanceDoc of snapshot.docs) {
      batch.update(attendanceDoc.ref, {
        ...(fields.round !== undefined ? { round: fields.round } : {}),
        ...(fields.generation !== undefined ? { generation: fields.generation } : {}),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}

export const meetingAdminRepository = new MeetingAdminRepository();
