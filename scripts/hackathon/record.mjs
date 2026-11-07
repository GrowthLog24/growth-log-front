/**
 * Orca 채점 워커가 쓴 hackathon/<teamId>/report.json 을 검증해 DB(hackathonScores)에 반영한다.
 * 오케스트레이터(코디네이터)만 실행한다.
 *
 * 실행: node --env-file=.env.local scripts/hackathon/record.mjs <teamId> [--by <워커 이름>]
 */
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS, HACKATHON_ID, createDb, teamDirOf, teamDocId } from "./lib.mjs";
import { buildScore } from "./rubric.mjs";

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`${path} 를 읽을 수 없습니다: ${error.message}`);
  }
}

async function main() {
  const teamId = process.argv[2];
  if (!teamId) throw new Error("사용법: record.mjs <teamId> [--by <워커 이름>]");
  const byIndex = process.argv.indexOf("--by");
  const teamDir = teamDirOf(teamId);
  const placed = readJson(`${teamDir}/placed.json`);
  const report = readJson(`${teamDir}/report.json`);
  if (report.teamId && report.teamId !== teamId) {
    throw new Error(`report.json 의 teamId(${report.teamId})가 ${teamId} 와 다릅니다.`);
  }
  const score = buildScore(report);
  const unchecked = ["github", "deploy", "demo", "prd"].filter((k) => report.links && report.links[k] && report.links[k].checked === false);
  const gradedBy = byIndex >= 0 ? process.argv[byIndex + 1] : `orca-${teamId}-${placed.round}`;

  const db = createDb();
  const submission = await getDoc(doc(db, COLLECTIONS.SUBMISSIONS, teamDocId(teamId)));
  if (!submission.exists()) throw new Error(`제출물 없음: ${teamId}`);
  await setDoc(doc(db, COLLECTIONS.SCORES, teamDocId(teamId)), {
    hackathonId: HACKATHON_ID,
    teamId,
    ...score,
    gradedBy,
    // 배치 시점의 제출 버전·시각: 채점 중 재제출이 오면 콘솔에 "재채점 필요"가 뜬다
    submissionVersion: placed.version,
    gradeStartedAt: placed.placedAt,
    gradedAt: Date.now(),
    round: placed.round,
    run: report.run ?? null,
    links: report.links ?? null,
    notes: typeof report.notes === "string" ? report.notes : "",
  });
  const isStale = submission.data().submittedAt > placed.version;
  console.log(`반영 완료: ${teamId} ${score.total}/${score.max} · ${placed.round} · by ${gradedBy}${isStale ? " · ⚠ 채점 중 재제출됨 → 재배치 필요" : ""}${report.links ? "" : " · ⚠ 링크 확인 결과 없음"}${unchecked.length ? ` · ⚠ 미확인 링크: ${unchecked.join(",")}` : ""}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`반영 실패: ${error.message}`);
    process.exit(1);
  });
