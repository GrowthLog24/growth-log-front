import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import { buildTeamDocId, buildVoteDocId } from "@/domain/hackathon/rules";
import type {
  Hackathon,
  HackathonScore,
  HackathonSecrets,
  HackathonSubmission,
  HackathonVote,
} from "@/domain/hackathon/types";

type WithoutId<T> = Omit<T, "id">;

/**
 * 해커톤 Repository
 *
 * 공개 화면(제출·대시보드·투표), API route, admin이 함께 사용한다.
 * 시각 필드는 epoch ms(number)로 저장하므로 직렬화 변환이 필요 없다.
 */
export class HackathonRepository {
  private configRef(hackathonId: string) {
    return doc(db, COLLECTIONS.HACKATHONS, hackathonId);
  }

  /** 행사 설정 조회 (없으면 null) */
  async getConfig(hackathonId: string): Promise<Hackathon | null> {
    const snapshot = await getDoc(this.configRef(hackathonId));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Hackathon;
  }

  /** 행사 설정 실시간 구독 */
  subscribeConfig(
    hackathonId: string,
    onChange: (config: Hackathon | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      this.configRef(hackathonId),
      (snapshot) =>
        onChange(
          snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as Hackathon)
            : null
        ),
      onError
    );
  }

  /** 행사 설정 저장 (부분 병합) */
  async saveConfig(
    hackathonId: string,
    patch: Partial<WithoutId<Hackathon>>
  ): Promise<void> {
    await setDoc(
      this.configRef(hackathonId),
      { ...patch, updatedAt: Date.now() },
      { merge: true }
    );
  }

  /** 팀 제출 코드 조회 (API route·admin 전용) */
  async getSecrets(hackathonId: string): Promise<HackathonSecrets | null> {
    const snapshot = await getDoc(
      doc(db, COLLECTIONS.HACKATHON_SECRETS, hackathonId)
    );
    return snapshot.exists() ? (snapshot.data() as HackathonSecrets) : null;
  }

  /** 팀 제출 코드 저장 (admin 전용) */
  async saveSecrets(hackathonId: string, secrets: HackathonSecrets): Promise<void> {
    await setDoc(doc(db, COLLECTIONS.HACKATHON_SECRETS, hackathonId), secrets);
  }

  /** 팀 제출물 조회 */
  async getSubmission(
    hackathonId: string,
    teamId: string
  ): Promise<HackathonSubmission | null> {
    const snapshot = await getDoc(
      doc(db, COLLECTIONS.HACKATHON_SUBMISSIONS, buildTeamDocId(hackathonId, teamId))
    );
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as HackathonSubmission;
  }

  /** 팀 제출물 저장 (문서 전체 교체) */
  async saveSubmission(submission: WithoutId<HackathonSubmission>): Promise<string> {
    const id = buildTeamDocId(submission.hackathonId, submission.teamId);
    await setDoc(doc(db, COLLECTIONS.HACKATHON_SUBMISSIONS, id), submission);
    return id;
  }

  /**
   * 팀 제출물을 처음 한 번만 저장합니다 (팀당 1회 제출).
   * 이미 제출물이 있으면 false 를 반환하고 쓰지 않습니다. 트랜잭션으로 동시 요청에서도 1회를 보장합니다.
   */
  async createSubmission(submission: WithoutId<HackathonSubmission>): Promise<boolean> {
    const ref = doc(
      db,
      COLLECTIONS.HACKATHON_SUBMISSIONS,
      buildTeamDocId(submission.hackathonId, submission.teamId)
    );
    return runTransaction(db, async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists()) return false;
      transaction.set(ref, submission);
      return true;
    });
  }

  /** 행사의 전체 제출물 조회 */
  async listSubmissions(hackathonId: string): Promise<HackathonSubmission[]> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.HACKATHON_SUBMISSIONS),
        where("hackathonId", "==", hackathonId)
      )
    );
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as HackathonSubmission
    );
  }

  /** 행사의 제출물 실시간 구독 */
  subscribeSubmissions(
    hackathonId: string,
    onChange: (submissions: HackathonSubmission[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTIONS.HACKATHON_SUBMISSIONS),
        where("hackathonId", "==", hackathonId)
      ),
      (snapshot) =>
        onChange(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HackathonSubmission)
        ),
      onError
    );
  }

  /** AI 채점 결과 실시간 구독 (admin, 그리고 scoresPublic일 때 대시보드) */
  subscribeScores(
    hackathonId: string,
    onChange: (scores: HackathonScore[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTIONS.HACKATHON_SCORES),
        where("hackathonId", "==", hackathonId)
      ),
      (snapshot) =>
        onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HackathonScore)),
      onError
    );
  }

  /** 투표 실시간 구독 (admin 전용) */
  subscribeVotes(
    hackathonId: string,
    onChange: (votes: HackathonVote[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTIONS.HACKATHON_VOTES),
        where("hackathonId", "==", hackathonId)
      ),
      (snapshot) =>
        onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as HackathonVote)),
      onError
    );
  }

  /** 회원이 이미 투표했는지 */
  async hasVoted(hackathonId: string, memberId: string): Promise<boolean> {
    const snapshot = await getDoc(
      doc(db, COLLECTIONS.HACKATHON_VOTES, buildVoteDocId(hackathonId, memberId))
    );
    return snapshot.exists();
  }

  /**
   * 투표를 기록합니다. 같은 회원의 투표가 이미 있으면 false를 반환하고 쓰지 않습니다.
   * 트랜잭션으로 동시 요청에서도 회원당 1표를 보장합니다.
   */
  async createVote(vote: WithoutId<HackathonVote>): Promise<boolean> {
    const ref = doc(
      db,
      COLLECTIONS.HACKATHON_VOTES,
      buildVoteDocId(vote.hackathonId, vote.memberId)
    );
    return runTransaction(db, async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists()) return false;
      transaction.set(ref, vote);
      return true;
    });
  }
}

export const hackathonRepository = new HackathonRepository();
