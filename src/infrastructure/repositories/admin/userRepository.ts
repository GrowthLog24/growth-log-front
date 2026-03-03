import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { IUserRepository } from "@/domain/repositories";
import type { User } from "@/domain/entities";

/**
 * 사용자 Repository Firestore 구현체
 */
export class UserRepository implements IUserRepository {
  /**
   * 이메일로 사용자 조회
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const docRef = doc(db, COLLECTIONS.USERS, email);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as User;
  }

  /**
   * 새 사용자 생성
   */
  async createUser(user: Omit<User, "createdAt" | "updatedAt">): Promise<User> {
    const docRef = doc(db, COLLECTIONS.USERS, user.email);
    const now = serverTimestamp();

    const userData = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, userData);

    // 생성된 사용자 다시 조회하여 반환
    const created = await this.getUserByEmail(user.email);
    if (!created) {
      throw new Error("Failed to create user");
    }
    return created;
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(
    email: string,
    data: Partial<Omit<User, "email" | "createdAt">>
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, email);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 관리자 여부 확인
   */
  async isAdmin(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user?.role === "admin";
  }
}

export const userRepository = new UserRepository();
