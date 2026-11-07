/**
 * 해커톤 로컬 스크립트 공용 모듈
 *
 * 실행: node --env-file=.env.local scripts/hackathon/<script>.mjs
 * 웹앱과 같은 Firebase 웹 설정(.env.local)으로 Firestore에 접근한다.
 */
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { resolve as resolvePath } from "node:path";

/** 이번 행사 ID — src/domain/hackathon/constants.ts 의 CURRENT_HACKATHON_ID 와 같아야 한다 */
export const HACKATHON_ID = process.env.HACKATHON_ID || "gl6-2026-11";

export const COLLECTIONS = {
  HACKATHONS: "hackathons",
  SECRETS: "hackathonSecrets",
  SUBMISSIONS: "hackathonSubmissions",
  SCORES: "hackathonScores",
  VOTES: "hackathonVotes",
  MEETINGS: "meetings",
  MEMBERS: "members",
};

/**
 * Firestore 인스턴스를 만든다. 환경변수가 없으면 즉시 실패한다.
 *
 * @returns {import("firebase/firestore").Firestore}
 */
export function createDb() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) {
    console.error("Firebase 환경변수가 없습니다. --env-file=.env.local 로 실행해 주세요.");
    process.exit(1);
  }
  const app = initializeApp({
    apiKey,
    projectId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return getFirestore(app);
}

/**
 * KST 기준 "YYYY-MM-DD HH:mm" 을 epoch ms 로 바꾼다.
 *
 * @param {string} value
 * @returns {number}
 */
export function kst(value) {
  const ms = Date.parse(`${value.replace(" ", "T")}:00+09:00`);
  if (Number.isNaN(ms)) throw new Error(`잘못된 시각: ${value}`);
  return ms;
}

/**
 * 팀 문서 ID (`${hackathonId}_${teamId}`)
 *
 * @param {string} teamId
 * @returns {string}
 */
export function teamDocId(teamId) {
  return `${HACKATHON_ID}_${teamId}`;
}

/** 실제 행사 ID — 이 행사만 hackathon/<teamId>/ 에, 리허설은 hackathon/_<행사ID>/<teamId>/ 에 둔다 */
const REAL_HACKATHON_ID = "gl6-2026-11";

/**
 * 팀 채점 폴더의 절대 경로
 *
 * @param {string} teamId
 * @returns {string}
 */
export function teamDirOf(teamId) {
  const base = HACKATHON_ID === REAL_HACKATHON_ID ? "hackathon" : `hackathon/_${HACKATHON_ID}`;
  return resolvePath(base, teamId);
}
