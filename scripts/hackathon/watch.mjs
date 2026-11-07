/**
 * 제출물을 실시간으로 지켜보다가 채점이 필요한 팀을 알려준다.
 * --spawn 을 주면 팀마다 독립된 `claude -p` 채점 세션을 띄운다 (같은 프롬프트, API 키 불필요).
 *
 * 실행:
 *   node --env-file=.env.local scripts/hackathon/watch.mjs           # 알림만
 *   node --env-file=.env.local scripts/hackathon/watch.mjs --spawn   # 마감(endAt) 후 자동 채점
 *   node --env-file=.env.local scripts/hackathon/watch.mjs --spawn --now  # 마감 전에도 즉시 채점
 *
 * 기본은 마감 시각까지 기다렸다가 채점한다. 제작 중에 채점하면 제출 이후의 커밋이
 * 반영되지 않은 저장소를 채점하게 되고, 커밋만으로는 재채점이 일어나지 않기 때문이다.
 *
 * 채점 필요 = 점수가 없거나, 점수의 submissionVersion 이 최신 submittedAt 보다 오래됨(재제출).
 * 같은 팀 세션이 돌고 있는 동안 재제출이 오면, 끝난 뒤 한 번 더 채점한다.
 */
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { COLLECTIONS, HACKATHON_ID, createDb } from "./lib.mjs";

const SHOULD_SPAWN = process.argv.includes("--spawn");
const GRADE_NOW = process.argv.includes("--now");
/** 마감 직후 마지막 push 가 GitHub 에 반영될 여유 */
const DEADLINE_GRACE_MS = 60_000;
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
let endAt = null; // 행사 마감 시각 (config 구독으로 갱신)
let deadlineTimer = null;
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
    {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      // score.mjs 가 이 팀 외의 점수 기록을 거부하도록 고정한다 (프롬프트 인젝션 방어)
      env: { ...process.env, HACKATHON_GRADER_TEAM: teamId },
    }
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
  if (!GRADE_NOW && (endAt === null || Date.now() < endAt + DEADLINE_GRACE_MS)) return; // 마감 후 일괄 채점
  if (running.has(teamId)) return; // 끝나면 close 핸들러가 다시 확인한다
  spawnGrader(teamId);
}

function scheduleDeadline() {
  if (deadlineTimer) clearTimeout(deadlineTimer);
  if (GRADE_NOW || endAt === null) return;
  const wait = endAt + DEADLINE_GRACE_MS - Date.now();
  const when = new Date(endAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Seoul" });
  if (wait > 0) console.log(`[${time()}] 마감 ${when} + 1분 뒤 일괄 채점 예약 (즉시 채점은 --now)`);
  deadlineTimer = setTimeout(() => {
    console.log(`[${time()}] 마감 도달 — 채점 시작`);
    for (const teamId of submissions.keys()) review(teamId);
  }, Math.max(0, wait));
}

function main() {
  const db = createDb();
  onSnapshot(doc(db, COLLECTIONS.HACKATHONS, HACKATHON_ID), (snapshot) => {
    const next = snapshot.data()?.endAt ?? null;
    if (next === endAt) return;
    endAt = next;
    scheduleDeadline();
  }, (error) => console.error("설정 구독 오류:", error.message));
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
