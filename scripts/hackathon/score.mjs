/**
 * 채점 결과 JSON 을 검증해 hackathonScores 에 기록한다.
 *
 * 실행: node --env-file=.env.local scripts/hackathon/score.mjs <teamId> <score.json> [--by <세션이름>]
 */
import { readFile } from "node:fs/promises";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS, HACKATHON_ID, createDb, teamDocId } from "./lib.mjs";
import { buildScore } from "./rubric.mjs";

function parseArgs(argv) {
  const [teamId, file] = argv;
  const byIndex = argv.indexOf("--by");
  const gradedBy = byIndex >= 0 ? argv[byIndex + 1] : `grader-${teamId}`;
  if (!teamId || !file) {
    throw new Error("사용법: score.mjs <teamId> <score.json> [--by <세션이름>]");
  }
  return { teamId, file, gradedBy };
}

async function main() {
  const { teamId, file, gradedBy } = parseArgs(process.argv.slice(2));
  const lockedTeam = process.env.HACKATHON_GRADER_TEAM;
  if (lockedTeam && lockedTeam !== teamId) {
    throw new Error(`이 채점 세션은 ${lockedTeam} 전용입니다. (${teamId} 기록 거부)`);
  }
  const score = buildScore(JSON.parse(await readFile(file, "utf8")));
  const db = createDb();
  const submission = await getDoc(doc(db, COLLECTIONS.SUBMISSIONS, teamDocId(teamId)));
  if (!submission.exists()) throw new Error(`제출물 없음: ${teamId}`);
  await setDoc(doc(db, COLLECTIONS.SCORES, teamDocId(teamId)), {
    hackathonId: HACKATHON_ID,
    teamId,
    ...score,
    gradedBy,
    submissionVersion: submission.data().submittedAt,
    gradedAt: Date.now(),
  });
  console.log(`기록 완료: ${teamId} ${score.total}/${score.max} (by ${gradedBy})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`채점 기록 실패: ${error.message}`);
    process.exit(1);
  });
