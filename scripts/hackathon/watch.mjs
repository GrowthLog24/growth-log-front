/**
 * 제출물을 실시간으로 지켜보다가 채점이 필요한 팀을 알려준다.
 * --spawn 을 주면 팀마다 독립된 `claude -p` 채점 세션을 띄운다 (같은 프롬프트, API 키 불필요).
 *
 * 실행:
 *   node --env-file=.env.local scripts/hackathon/watch.mjs           # 알림만
 *   node --env-file=.env.local scripts/hackathon/watch.mjs --spawn              # 예비 + 최종 채점
 *   node --env-file=.env.local scripts/hackathon/watch.mjs --spawn --final-only # 마감 후 최종 채점만
 *
 * 기본(혼합): 제출이 들어오면 바로 예비 채점하고, 마감 1분 뒤 마감 전에 채점된 팀을
 * 최종 코드로 다시 채점해 덮어쓴다. 예비 점수는 마감 때 세션이 실패해도 쓸 수 있는 보험이고,
 * 최종 채점은 제출 이후 커밋(재제출 없이 push 만 한 경우)을 반영하기 위해서다.
 *
 * 채점 필요 = 점수가 없거나, 점수의 submissionVersion 이 최신 submittedAt 보다 오래됨(재제출).
 * 같은 팀 세션이 돌고 있는 동안 재제출이 오면, 끝난 뒤 한 번 더 채점한다.
 */
import { spawn } from "node:child_process";
import { chmodSync, copyFileSync, createWriteStream, existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { COLLECTIONS, HACKATHON_ID, createDb } from "./lib.mjs";

const SHOULD_SPAWN = process.argv.includes("--spawn");
const FINAL_ONLY = process.argv.includes("--final-only");
/** 마감 직후 마지막 push 가 GitHub 에 반영될 여유 */
const DEADLINE_GRACE_MS = 60_000;
const ROOT = "/tmp/hackathon-grading";
const LOG_DIR = `${ROOT}/logs`;
/**
 * 채점 세션 작업 폴더. 저장소(.env.local 의 비밀키)와 분리하고,
 * 공개 Firebase 웹 설정만 담은 .env.public 과 채점 스크립트 사본만 둔다.
 */
const RUNNER_DIR = `${ROOT}/runner`;
const RUNNER_FILES = ["lib.mjs", "get.mjs", "score.mjs", "rubric.mjs", "grading-prompt.md"];
/** macOS 의 /tmp 는 /private/tmp 의 링크라 권한 규칙을 두 형태로 적는다 (// = 절대 경로) */
const scoped = (tool, path) => [`${tool}(/${path})`, `${tool}(//private${path})`];
/**
 * 편집은 acceptEdits 로 작업 폴더(ROOT) 안에서만 허용하고, 스크립트 사본 폴더는 쓰기 금지.
 * 작업 폴더 밖(저장소, 홈 디렉터리)은 읽기·쓰기 모두 허용되지 않는다.
 */
const ALLOWED_TOOLS = [
  ...scoped("Read", `${ROOT}/**`),
  ...scoped("Grep", `${ROOT}/**`),
  ...scoped("Glob", `${ROOT}/**`),
  "WebFetch",
  "Bash(git clone:*)",
  "Bash(git -C:*)",
  "Bash(node --env-file=.env.public get.mjs:*)",
  "Bash(node --env-file=.env.public score.mjs:*)",
];
const DISALLOWED_TOOLS = [
  ...scoped("Write", `${RUNNER_DIR}/**`),
  ...scoped("Edit", `${RUNNER_DIR}/**`),
];
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 60_000;

const submissions = new Map(); // teamId → submission
const scores = new Map(); // teamId → score
const running = new Map(); // teamId → submittedAt being graded
const attempts = new Map(); // `${teamId}:${submittedAt}` → 시도 횟수
let endAt = null; // 행사 마감 시각 (config 구독으로 갱신)
let deadlineTimer = null;
const time = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Seoul" });

function isAfterDeadline() {
  return endAt !== null && Date.now() >= endAt + DEADLINE_GRACE_MS;
}

/** 채점 단계: 마감 전은 예비(early), 마감 후는 최종(final) */
function gradingPhase() {
  return isAfterDeadline() ? "final" : "early";
}

function needsGrading(teamId) {
  const submission = submissions.get(teamId);
  if (!submission) return false;
  const score = scores.get(teamId);
  if (!score || score.submissionVersion < submission.submittedAt) return true;
  // 마감 후: 마감 전에 매긴 예비 점수는 최종 코드로 다시 채점한다
  // 채점 '시작' 시각 기준: 마감 직전에 시작해 마감 뒤에 끝난 세션도 예비 점수로 본다
  const startedAt = score.gradeStartedAt ?? score.gradedAt;
  return isAfterDeadline() && startedAt < endAt + DEADLINE_GRACE_MS;
}

/** 비밀키 없는 채점 작업 폴더를 만든다 (스크립트는 읽기 전용 사본). */
function prepareRunner() {
  mkdirSync(`${ROOT}/out`, { recursive: true });
  mkdirSync(`${ROOT}/repos`, { recursive: true });
  mkdirSync(RUNNER_DIR, { recursive: true });
  for (const file of RUNNER_FILES) {
    const target = `${RUNNER_DIR}/${file}`;
    if (existsSync(target)) chmodSync(target, 0o644);
    copyFileSync(resolve("scripts/hackathon", file), target);
    chmodSync(target, 0o444);
  }
  if (!existsSync(`${RUNNER_DIR}/node_modules`)) {
    symlinkSync(resolve("node_modules"), `${RUNNER_DIR}/node_modules`);
  }
  const publicEnv = Object.entries(process.env)
    .filter(([key]) => key.startsWith("NEXT_PUBLIC_FIREBASE_") || key === "HACKATHON_ID")
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  writeFileSync(`${RUNNER_DIR}/.env.public`, `${publicEnv}\n`);
}

function spawnGrader(teamId) {
  const version = submissions.get(teamId).submittedAt;
  const phase = gradingPhase();
  const key = `${teamId}:${version}:${phase}`;
  attempts.set(key, (attempts.get(key) ?? 0) + 1);
  const session = `grader-${teamId}-${phase}-${attempts.get(key)}`;
  mkdirSync(LOG_DIR, { recursive: true });
  const log = createWriteStream(`${LOG_DIR}/${session}.log`);
  const prompt = `grading-prompt.md 를 읽고 그 절차대로 teamId=${teamId} 한 팀만 채점하라. <세션이름> 은 ${session} 이다.`;
  const child = spawn(
    "claude",
    [
      "-p", prompt,
      "--permission-mode", "acceptEdits",
      "--add-dir", ROOT,
      "--allowedTools", ...ALLOWED_TOOLS,
      "--disallowedTools", ...DISALLOWED_TOOLS,
    ],
    {
      cwd: RUNNER_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      // score.mjs 가 이 팀·이 제출 버전 외의 기록을 거부하도록 고정한다 (프롬프트 인젝션·재제출 경합 방어)
      env: {
        ...process.env,
        HACKATHON_GRADER_TEAM: teamId,
        HACKATHON_GRADE_VERSION: String(version),
        HACKATHON_GRADE_STARTED_AT: String(Date.now()),
      },
    }
  );
  running.set(teamId, version);
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  console.log(`[${time()}] ▶ ${teamId} 채점 세션 시작 (${session}) · 로그 ${LOG_DIR}/${session}.log`);
  child.on("error", (error) => {
    console.error(`[${time()}] ✖ ${teamId} 세션 실행 실패: ${error.message}`);
  });
  child.on("close", (code) => {
    running.delete(teamId);
    console.log(`[${time()}] ■ ${teamId} 채점 세션 종료 (exit ${code})`);
    setTimeout(() => review(teamId), needsGrading(teamId) ? RETRY_DELAY_MS : 0);
  });
}

function review(teamId) {
  if (!needsGrading(teamId)) return;
  const submission = submissions.get(teamId);
  if (!SHOULD_SPAWN) {
    console.log(`[${time()}] ● 채점 필요: ${teamId} ${submission.projectName} (제출 ${submission.submitCount}회)`);
    return;
  }
  if (FINAL_ONLY && !isAfterDeadline()) return; // --final-only: 마감 후에만 채점
  if (running.has(teamId)) return; // 끝나면 close 핸들러가 다시 확인한다
  const key = `${teamId}:${submission.submittedAt}:${gradingPhase()}`;
  if ((attempts.get(key) ?? 0) >= MAX_ATTEMPTS) {
    if (attempts.get(key) === MAX_ATTEMPTS) {
      console.error(`[${time()}] ✖ ${teamId} ${MAX_ATTEMPTS}회 시도에도 점수 없음 — 로그 확인 후 수동 채점 필요`);
      attempts.set(key, MAX_ATTEMPTS + 1);
    }
    return;
  }
  spawnGrader(teamId);
}

function scheduleDeadline() {
  if (deadlineTimer) clearTimeout(deadlineTimer);
  if (endAt === null) return;
  const wait = endAt + DEADLINE_GRACE_MS - Date.now();
  const when = new Date(endAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Seoul" });
  if (wait > 0) console.log(`[${time()}] 마감 ${when} + 1분 뒤 최종 채점 예약 ${FINAL_ONLY ? "(마감 전 채점 안 함)" : "(그 전엔 제출 즉시 예비 채점)"}`);
  deadlineTimer = setTimeout(() => {
    console.log(`[${time()}] 마감 도달 — 최종 채점 시작`);
    for (const teamId of submissions.keys()) review(teamId);
  }, Math.max(0, wait));
}

function main() {
  const db = createDb();
  if (SHOULD_SPAWN) prepareRunner();
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
