import { describe, it, expect } from "vitest";
import {
  buildExportJson,
  buildSubmissionsMarkdown,
  buildTeamMarkdown,
  formatKstDateTime,
  formatKstTime,
  formatTeamMembers,
  pairTeamsWithSubmissions,
} from "./hackathonExport";
import type {
  Hackathon,
  HackathonSubmission,
  HackathonTeam,
} from "@/domain/hackathon/types";

// 2026-11-07 15:30:00 KST = 06:30:00 UTC
const START = Date.UTC(2026, 10, 7, 6, 30, 0);
const END = Date.UTC(2026, 10, 7, 8, 10, 0);

const TEAMS: HackathonTeam[] = [
  {
    id: "team-1",
    name: "1팀",
    members: [
      { memberId: "m1", name: "가나" },
      { memberId: null, name: "다라" },
    ],
  },
  { id: "team-2", name: "2팀", members: [] },
];

const HACKATHON: Hackathon = {
  id: "gl6-2026-11",
  title: "100분 해커톤",
  startAt: START,
  endAt: END,
  teams: TEAMS,
  meetingId: null,
  scoresPublic: false,
  votingOpen: false,
  updatedAt: START,
};

const SUBMISSION: HackathonSubmission = {
  id: "gl6-2026-11_team-1",
  hackathonId: "gl6-2026-11",
  teamId: "team-1",
  teamName: "1팀",
  projectName: "그로스봇",
  track: "A",
  githubUrl: "https://github.com/a/b",
  oneLiner: "공부를 돕는 봇",
  deployUrl: "https://bot.example.com",
  demoUrl: "",
  planPurpose: "목적 본문",
  planFeatures: "기능 본문",
  planExpected: "예상 결과 본문",
  prdUrl: "",
  firstSubmittedAt: END - 60_000,
  submittedAt: END + 12_000,
  submitCount: 2,
  isLate: true,
};

describe("formatKstDateTime / formatKstTime", () => {
  it("UTC epoch를 KST 문자열로 바꾼다", () => {
    expect(formatKstDateTime(START)).toBe("2026-11-07 15:30:00");
    expect(formatKstTime(END + 12_000)).toBe("17:10:12");
  });

  it("KST 자정을 넘기면 날짜가 바뀐다", () => {
    const utc15 = Date.UTC(2026, 10, 7, 15, 0, 0);
    expect(formatKstDateTime(utc15)).toBe("2026-11-08 00:00:00");
  });
});

describe("formatTeamMembers", () => {
  it("이름을 쉼표로 잇는다", () => {
    expect(formatTeamMembers(TEAMS[0])).toBe("가나, 다라");
  });

  it("팀원이 없거나 팀이 없으면 '-'", () => {
    expect(formatTeamMembers(TEAMS[1])).toBe("-");
    expect(formatTeamMembers(undefined)).toBe("-");
  });
});

describe("pairTeamsWithSubmissions", () => {
  it("팀 순서를 유지하고 미제출 팀은 submission이 undefined", () => {
    const pairs = pairTeamsWithSubmissions(TEAMS, [SUBMISSION]);
    expect(pairs.map((p) => p.team?.id)).toEqual(["team-1", "team-2"]);
    expect(pairs[0].submission).toBe(SUBMISSION);
    expect(pairs[1].submission).toBeUndefined();
  });

  it("설정에 없는 팀의 제출물은 뒤에 붙인다", () => {
    const orphan = { ...SUBMISSION, teamId: "team-9", teamName: "9팀" };
    const pairs = pairTeamsWithSubmissions(TEAMS, [orphan]);
    expect(pairs).toHaveLength(3);
    expect(pairs[2]).toEqual({ team: undefined, submission: orphan });
  });

  it("빈 팀·빈 제출물이면 빈 배열", () => {
    expect(pairTeamsWithSubmissions([], [])).toEqual([]);
  });
});

describe("buildTeamMarkdown", () => {
  it("제출물의 모든 항목을 포함한다", () => {
    const md = buildTeamMarkdown(TEAMS[0], SUBMISSION);
    expect(md).toContain("## 1팀 — 그로스봇");
    expect(md).toContain("- 팀 ID: team-1");
    expect(md).toContain("- 팀원: 가나, 다라");
    expect(md).toContain("- 트랙: A (Learn");
    expect(md).toContain("- GitHub: https://github.com/a/b");
    expect(md).toContain("- 배포 링크: https://bot.example.com");
    expect(md).toContain("- 시연 자료: -");
    expect(md).toContain("- PRD·기획 문서: -");
    expect(md).toContain("- 제출 시각: 2026-11-07 17:10:12 (KST) · 제출 2회");
    expect(md).toContain("- 마감 후 제출: 예 (지각 제출)");
    expect(md).toContain("### 기획 — 목적\n\n목적 본문");
    expect(md).toContain("### 기획 — 핵심 기능·비즈니스 로직\n\n기능 본문");
    expect(md).toContain("### 기획 — 예상 결과\n\n예상 결과 본문");
  });

  it("정시 제출이면 '아니오'", () => {
    const md = buildTeamMarkdown(TEAMS[0], { ...SUBMISSION, isLate: false });
    expect(md).toContain("- 마감 후 제출: 아니오");
  });

  it("미제출 팀은 (미제출)로 표시한다", () => {
    const md = buildTeamMarkdown(TEAMS[1], undefined);
    expect(md).toContain("## 2팀 — (미제출)");
    expect(md).not.toContain("GitHub");
  });

  it("설정에서 사라진 팀은 제출물의 팀 이름을 쓴다", () => {
    const md = buildTeamMarkdown(undefined, SUBMISSION);
    expect(md).toContain("## 1팀 — 그로스봇");
    expect(md).toContain("- 팀원: -");
  });
});

describe("buildSubmissionsMarkdown", () => {
  it("헤더와 팀 섹션을 구분선으로 잇는다", () => {
    const md = buildSubmissionsMarkdown({
      hackathon: HACKATHON,
      submissions: [SUBMISSION],
      generatedAt: END,
    });
    expect(md.startsWith("# 100분 해커톤 제출물")).toBe(true);
    expect(md).toContain("- 제출 팀: 1 / 2");
    expect(md).toContain(
      "- 제작 시간: 2026-11-07 15:30:00 ~ 2026-11-07 17:10:00 (KST)"
    );
    expect(md.split("\n---\n")).toHaveLength(3);
    expect(md.indexOf("## 1팀")).toBeLessThan(md.indexOf("## 2팀"));
  });

  it("팀이 없으면 헤더만 만든다", () => {
    const md = buildSubmissionsMarkdown({
      hackathon: { ...HACKATHON, teams: [] },
      submissions: [],
      generatedAt: END,
    });
    expect(md).toContain("- 제출 팀: 0 / 0");
    expect(md).not.toContain("---");
  });
});

describe("buildExportJson", () => {
  it("입력 배열을 복사하고 secrets 필드를 포함하지 않는다", () => {
    const submissions = [SUBMISSION];
    const json = buildExportJson({
      hackathon: HACKATHON,
      submissions,
      scores: [],
      votes: [],
      exportedAt: END,
    });
    expect(json.submissions).toEqual(submissions);
    expect(json.submissions).not.toBe(submissions);
    expect(Object.keys(json)).not.toContain("codes");
    expect(JSON.stringify(json)).not.toContain("codes");
  });
});
