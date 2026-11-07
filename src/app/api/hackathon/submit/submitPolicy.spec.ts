import { describe, expect, it } from "vitest";
import type {
  HackathonSubmission,
  HackathonSubmissionInput,
} from "@/domain/hackathon/types";
import {
  HACKATHON_LATE_GRACE_MS,
  buildSubmissionRecord,
  isSubmissionClosed,
} from "./submitPolicy";

const END_AT = 1_000_000;
const TEAM = { id: "team-1", name: "1팀" };
const INPUT: HackathonSubmissionInput = {
  projectName: "그로스봇",
  track: "A",
  githubUrl: "https://github.com/a/b",
  oneLiner: "한 줄",
  deployUrl: "",
  demoUrl: "https://youtu.be/x",
  planPurpose: "목적",
  planFeatures: "기능",
  planExpected: "결과",
  prdUrl: "",
};

describe("isSubmissionClosed", () => {
  it("마감 직후에는 열려 있음", () => {
    expect(isSubmissionClosed(END_AT + 1, END_AT)).toBe(false);
  });

  it("유예 시간 경계까지는 열려 있음", () => {
    expect(isSubmissionClosed(END_AT + HACKATHON_LATE_GRACE_MS, END_AT)).toBe(false);
  });

  it("유예 시간을 넘기면 닫힘", () => {
    expect(isSubmissionClosed(END_AT + HACKATHON_LATE_GRACE_MS + 1, END_AT)).toBe(true);
  });
});

describe("buildSubmissionRecord", () => {
  it("첫 제출은 횟수 1, 최초 시각 = 현재", () => {
    const record = buildSubmissionRecord({
      hackathonId: "h",
      team: TEAM,
      input: INPUT,
      existing: null,
      now: 500,
      endAt: END_AT,
    });
    expect(record).toMatchObject({
      teamId: "team-1",
      teamName: "1팀",
      firstSubmittedAt: 500,
      submittedAt: 500,
      submitCount: 1,
      isLate: false,
      projectName: "그로스봇",
    });
  });

  it("재제출은 최초 시각 유지, 횟수 증가, 마감 후면 지각", () => {
    const existing: HackathonSubmission = {
      ...INPUT,
      id: "h_team-1",
      hackathonId: "h",
      teamId: "team-1",
      teamName: "1팀",
      firstSubmittedAt: 100,
      submittedAt: 200,
      submitCount: 2,
      isLate: false,
    };
    const record = buildSubmissionRecord({
      hackathonId: "h",
      team: TEAM,
      input: { ...INPUT, projectName: "바뀐 이름" },
      existing,
      now: END_AT + 10,
      endAt: END_AT,
    });
    expect(record.firstSubmittedAt).toBe(100);
    expect(record.submitCount).toBe(3);
    expect(record.isLate).toBe(true);
    expect(record.projectName).toBe("바뀐 이름");
    expect("id" in record).toBe(false);
  });
});
