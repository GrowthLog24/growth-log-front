/**
 * DB 제출물을 팀별 폴더(hackathon/<teamId>/)에 배치하고, Orca 채점 워커 지시서를 만든다.
 *
 * 실행: node --env-file=.env.local scripts/hackathon/place.mjs [--final] [--team team-1]
 *   --final  마감 후 최종 채점 라운드 (이미 채점된 팀도 다시 배치)
 *
 * 출력 마지막 줄: PLACED <teamId> <teamId> ... (채점 워커를 띄울 팀 목록)
 * 팀 폴더 구성:
 *   submission.md / submission.json  DB 제출물 (참가자 작성 데이터)
 *   placed.json                      배치 시각·제출 버전·라운드 (record.mjs 가 사용)
 *   spec.md                          Orca 워커 지시서
 *   repo/                            워커가 클론하는 저장소
 *   report.json                      워커가 쓰는 채점 결과
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { COLLECTIONS, HACKATHON_ID, createDb, teamDirOf } from "./lib.mjs";
import { renderSubmission, safeGithub } from "./submission-format.mjs";

const IS_FINAL = process.argv.includes("--final");
const ONLY_TEAM = process.argv.includes("--team") ? process.argv[process.argv.indexOf("--team") + 1] : null;
const TEMPLATE = resolve("scripts/hackathon/worker-spec.md");
const PORT_BASE = 4100;

function lastPlaced(teamDir) {
  const file = `${teamDir}/placed.json`;
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

function shouldPlace(prev, submission, score, endAt) {
  if (!prev || prev.version !== submission.submittedAt) return true; // 새 제출·재제출
  if (!IS_FINAL) return false;
  const startedAt = score?.gradeStartedAt ?? score?.gradedAt ?? 0;
  return startedAt < endAt; // 최종 라운드: 마감 전에 시작된 점수는 다시 채점
}

function writeSpec(teamDir, team, config, port, round) {
  const spec = readFileSync(TEMPLATE, "utf8")
    .replaceAll("{{TEAM_ID}}", team.teamId)
    .replaceAll("{{TEAM_NAME}}", team.teamName)
    .replaceAll("{{TEAM_DIR}}", teamDir)
    .replaceAll("{{PORT}}", String(port))
    .replaceAll("{{ROUND}}", round)
    .replaceAll("{{END_AT}}", String(config.endAt))
    .replaceAll("{{GITHUB}}", safeGithub(team.githubUrl))
    .replaceAll("{{RUBRIC}}", resolve("scripts/hackathon/grading-prompt.md"));
  writeFileSync(`${teamDir}/spec.md`, spec);
}

async function main() {
  const db = createDb();
  const config = (await getDoc(doc(db, COLLECTIONS.HACKATHONS, HACKATHON_ID))).data();
  if (!config) throw new Error(`행사 설정 없음: ${HACKATHON_ID}`);
  const byHackathon = (name) => query(collection(db, name), where("hackathonId", "==", HACKATHON_ID));
  const [subs, scores] = await Promise.all([getDocs(byHackathon(COLLECTIONS.SUBMISSIONS)), getDocs(byHackathon(COLLECTIONS.SCORES))]);
  const scoreByTeam = new Map(scores.docs.map((d) => [d.data().teamId, d.data()]));
  const placed = [];
  const round = IS_FINAL || Date.now() >= config.endAt ? "final" : "early";
  for (const d of subs.docs) {
    const s = d.data();
    if (ONLY_TEAM && s.teamId !== ONLY_TEAM) continue;
    const teamDir = teamDirOf(s.teamId);
    mkdirSync(teamDir, { recursive: true });
    if (!ONLY_TEAM && !shouldPlace(lastPlaced(teamDir), s, scoreByTeam.get(s.teamId), config.endAt)) continue;
    const team = config.teams.find((t) => t.id === s.teamId);
    writeFileSync(`${teamDir}/submission.json`, JSON.stringify(s, null, 2));
    writeFileSync(`${teamDir}/submission.md`, renderSubmission(s, config, team));
    const port = PORT_BASE + Number(s.teamId.replace(/\D/g, "") || 0);
    writeFileSync(`${teamDir}/placed.json`, JSON.stringify({ teamId: s.teamId, version: s.submittedAt, round, placedAt: Date.now(), port }, null, 2));
    writeSpec(teamDir, s, config, port, round);
    placed.push(s.teamId);
    console.log(`배치: ${s.teamName} (${s.projectName}) → ${teamDir} · ${round} · 포트 ${port}`);
  }
  console.log(`PLACED ${placed.join(" ")}`.trim());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`배치 실패: ${error.message}`);
    process.exit(1);
  });
