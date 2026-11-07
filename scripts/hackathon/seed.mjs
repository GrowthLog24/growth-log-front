/**
 * 해커톤 행사 설정 시드 (재실행 안전)
 *
 * - hackathons/{id}: 제목·시각·팀 구성 (기존 토글 값은 유지)
 * - hackathonSecrets/{id}: 기존 팀 코드는 유지하고, 코드가 없는 팀만 새로 발급
 * - meetings: 오늘 정기모임 회차가 없으면 생성하고 meetingId 로 연결
 *
 * 실행: node --env-file=.env.local scripts/hackathon/seed.mjs
 */
import { randomInt } from "node:crypto";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { COLLECTIONS, HACKATHON_ID, createDb, kst } from "./lib.mjs";

const TITLE = "그로스로그 6기 11월 정기모임 — 100분 해커톤";
const START_AT = kst("2026-11-07 15:30");
const END_AT = kst("2026-11-07 17:10");
const MEETING_DATE = new Date(kst("2026-11-07 00:00"));

/**
 * 확정 팀 편성 (11/07 13:45, 신청 시트 최신 응답 반영)
 * - 정지은·김응원 결석, 이황수·박세호 추가 참석
 * - 이현정(15~16시)은 3팀 3인조, 유민혜(~17시)는 5팀
 * - 손궁(임원) 참가자로 추가 → 6팀
 */
const TEAMS = [
  ["황지현", "박창현"],
  ["박진영", "이선아"],
  ["김동현", "박세호", "이현정"],
  ["권선화", "이민호"],
  ["김류흔", "유민혜"],
  ["이황수", "손궁"],
];

const db = createDb();

async function resolveMembers(names) {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  return names.map((name) => {
    const hits = snapshot.docs.filter((d) => d.data().memberName === name);
    if (hits.length !== 1) {
      console.warn(`⚠️  회원 매칭 ${hits.length}건: ${name} — memberId 없이 저장`);
      return { memberId: null, name };
    }
    return { memberId: hits[0].id, name };
  });
}

async function ensureMeeting() {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.MEETINGS), where("generation", "==", 6))
  );
  const today = snapshot.docs.find(
    (d) => d.data().meetingDate?.toMillis?.() === MEETING_DATE.getTime()
  );
  if (today) return today.id;
  const regularRounds = snapshot.docs
    .filter((d) => (d.data().type ?? "정기모임") === "정기모임")
    .map((d) => d.data().round);
  const round = Math.max(0, ...regularRounds) + 1;
  const ref = await addDoc(collection(db, COLLECTIONS.MEETINGS), {
    generation: 6,
    round,
    type: "정기모임",
    title: `6기 ${round}회차 정기모임`,
    meetingDate: MEETING_DATE,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log(`회차 생성: 6기 ${round}회차 정기모임 (${ref.id})`);
  return ref.id;
}

function generateCodes(teamIds, existing = {}) {
  const used = new Set(Object.values(existing));
  const codes = {};
  for (const id of teamIds) {
    if (existing[id]) {
      codes[id] = existing[id];
      continue;
    }
    let code;
    do code = String(randomInt(0, 10000)).padStart(4, "0");
    while (used.has(code));
    used.add(code);
    codes[id] = code;
  }
  return codes;
}

async function main() {
  const teams = [];
  for (const [index, names] of TEAMS.entries()) {
    teams.push({
      id: `team-${index + 1}`,
      name: `${index + 1}팀`,
      members: await resolveMembers(names),
    });
  }
  const meetingId = await ensureMeeting();

  const configRef = doc(db, COLLECTIONS.HACKATHONS, HACKATHON_ID);
  const existing = await getDoc(configRef);
  await setDoc(
    configRef,
    {
      title: TITLE,
      startAt: START_AT,
      endAt: END_AT,
      teams,
      meetingId,
      scoresPublic: existing.data()?.scoresPublic ?? false,
      votingOpen: existing.data()?.votingOpen ?? false,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  const secretsRef = doc(db, COLLECTIONS.SECRETS, HACKATHON_ID);
  const secrets = await getDoc(secretsRef);
  const existingCodes = secrets.exists() ? secrets.data().codes ?? {} : {};
  const codes = generateCodes(teams.map((t) => t.id), existingCodes);
  const added = Object.keys(codes).filter((id) => !existingCodes[id]);
  if (added.length > 0) {
    await setDoc(secretsRef, { codes });
    console.log(`팀 코드 발급: ${added.join(", ")} (기존 코드 유지 · admin/hackathon 에서 확인)`);
  }
  console.log(`시드 완료: ${HACKATHON_ID} · 팀 ${teams.length} · meetingId ${meetingId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("시드 실패:", error);
    process.exit(1);
  });
