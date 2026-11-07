/**
 * 제출물을 실시간으로 지켜보다가 채점이 필요한 팀을 알려준다.
 * --spawn 을 주면 팀마다 독립된 `claude -p` 채점 세션을 띄운다 (같은 프롬프트, API 키 불필요).
 *
 * 실행:
 *   node --env-file=.env.local scripts/hackathon/watch.mjs           # 알림만
 *   node --env-file=.env.local scripts/hackathon/watch.mjs --spawn   # 자동 채점
 *
 * 채점 필요 = 점수가 없거나, 점수의 submissionVersion 이 최신 submittedAt 보다 오래됨(재제출).
 * 같은 팀 세션이 돌고 있는 동안 재제출이 오면, 끝난 뒤 한 번 더 채점한다.
 */
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { COLLECTIONS, HACKATHON_ID, createDb } from "./lib.mjs";

const SHOULD_SPAWN = process.argv.includes("--spawn");
const LOG_DIR = "/tmp/hackathon-grading/logs";
const ALLOWED_TOOLS = [
  "Read",
  "Grep",
  "Glob",
  "WebFetch",
  "Write",
  "Bash(git clone:*)",
  "Bash(git -C:*)",
  "Bash(node --env-file=.env.local scripts/hackathon/get.mjs:*)",
  "Bash(node --env-file=.env.local scripts/hackathon/score.mjs:*)",
];

const submissions = new Map(); // teamId → submission
const scores = new Map(); // teamId → score
const running = new Map(); // teamId → submittedAt being graded
const time = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Seoul" });

function needsGrading(teamId) {
  const submission = submissions.get(teamId);
  if (!submission) return false;
  const score = scores.get(teamId);
  return !score || score.submissionVersion < submission.submittedAt;
}

function spawnGrader(teamId) {
  const version = submissions.get(teamId).submittedAt;
  const session = `grader-${teamId}-${version}`;
  mkdirSync(LOG_DIR, { recursive: true });
  const log = createWriteStream(`${LOG_DIR}/${session}.log`);
  const prompt = `scripts/hackathon/grading-prompt.md 를 읽고 그 절차대로 teamId=${teamId} 한 팀만 채점하라. score.mjs 의 --by 값은 ${session} 으로 한다.`;
  const child = spawn(
    "claude",
    ["-p", prompt, "--add-dir", "/tmp/hackathon-grading", "--allowedTools", ...ALLOWED_TOOLS],
    { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] }
  );
  running.set(teamId, version);
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  console.log(`[${time()}] ▶ ${teamId} 채점 세션 시작 (${session}) · 로그 ${LOG_DIR}/${session}.log`);
  child.on("close", (code) => {
    running.delete(teamId);
    console.log(`[${time()}] ■ ${teamId} 채점 세션 종료 (exit ${code})`);
    review(teamId);
  });
}

function review(teamId) {
  if (!needsGrading(teamId)) return;
  const submission = submissions.get(teamId);
  if (!SHOULD_SPAWN) {
    console.log(`[${time()}] ● 채점 필요: ${teamId} ${submission.projectName} (제출 ${submission.submitCount}회)`);
    return;
  }
  if (running.has(teamId)) return; // 끝나면 close 핸들러가 다시 확인한다
  spawnGrader(teamId);
}

function main() {
  const db = createDb();
  const byHackathon = (name) =>
    query(collection(db, name), where("hackathonId", "==", HACKATHON_ID));
  let scoresReady = false;
  onSnapshot(byHackathon(COLLECTIONS.SCORES), (snapshot) => {
    for (const d of snapshot.docs) scores.set(d.data().teamId, d.data());
    scoresReady = true;
    for (const teamId of submissions.keys()) review(teamId);
  }, (error) => console.error("점수 구독 오류:", error.message));
  onSnapshot(byHackathon(COLLECTIONS.SUBMISSIONS), (snapshot) => {
    for (const change of snapshot.docChanges()) {
      const data = change.doc.data();
      submissions.set(data.teamId, data);
      console.log(`[${time()}] ⇣ ${data.teamName} 제출 ${change.type === "added" ? "확인" : "갱신"}: ${data.projectName}`);
    }
    if (scoresReady) for (const teamId of submissions.keys()) review(teamId);
  }, (error) => console.error("제출 구독 오류:", error.message));
  console.log(`[${time()}] ${HACKATHON_ID} 감시 시작 ${SHOULD_SPAWN ? "(자동 채점 ON)" : "(알림만)"}`);
}

main();
