/**
 * 팀 제출물을 채점 세션용으로 출력한다.
 *
 * 실행: node --env-file=.env.local scripts/hackathon/get.mjs <teamId>
 */
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS, HACKATHON_ID, createDb, teamDocId } from "./lib.mjs";
import { renderSubmission } from "./submission-format.mjs";


async function main() {
  const teamId = process.argv[2];
  if (!teamId) throw new Error("사용법: get.mjs <teamId> (예: team-1)");
  const db = createDb();
  const [configSnap, subSnap] = await Promise.all([
    getDoc(doc(db, COLLECTIONS.HACKATHONS, HACKATHON_ID)),
    getDoc(doc(db, COLLECTIONS.SUBMISSIONS, teamDocId(teamId))),
  ]);
  if (!configSnap.exists()) throw new Error(`행사 설정 없음: ${HACKATHON_ID}`);
  if (!subSnap.exists()) throw new Error(`제출물 없음: ${teamId}`);
  const config = configSnap.data();
  const s = subSnap.data();
  const team = config.teams.find((t) => t.id === teamId);
  console.log(renderSubmission(s, config, team));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
