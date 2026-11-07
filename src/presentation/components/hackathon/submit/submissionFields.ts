import { HACKATHON_TEXT_LIMITS } from "@/domain/hackathon/constants";
import type { HackathonSubmissionInput } from "@/domain/hackathon/types";

type InputKey = keyof HackathonSubmissionInput;

/** 화면 표시 순서 (첫 오류 포커스에 사용) */
export const FIELD_ORDER: readonly InputKey[] = [
  "projectName",
  "oneLiner",
  "track",
  "githubUrl",
  "deployUrl",
  "demoUrl",
  "prdUrl",
  "planPurpose",
  "planFeatures",
  "planExpected",
];

/**
 * 필드의 DOM id를 만듭니다. 트랙은 첫 번째 라디오 카드에 포커스합니다.
 *
 * @param {keyof HackathonSubmissionInput} key - 필드 이름
 * @returns {string} DOM id
 */
export function fieldDomId(key: InputKey): string {
  return key === "track" ? "submit-track-A" : `submit-${key}`;
}

/** 텍스트 입력 필드 설정 */
export interface TextFieldConfig {
  key: Exclude<InputKey, "track">;
  label: string;
  isRequired: boolean;
  placeholder: string;
  hint?: string;
  maxLength?: number;
}

/** 기본 정보 입력 필드 */
export const BASIC_FIELDS: readonly TextFieldConfig[] = [
  {
    key: "projectName",
    label: "프로젝트 이름",
    isRequired: true,
    placeholder: "예: 그로스봇",
    maxLength: HACKATHON_TEXT_LIMITS.projectName,
  },
  {
    key: "oneLiner",
    label: "한 줄 소개",
    isRequired: true,
    placeholder: "어떤 서비스인지 한 문장으로 알려 주세요",
    maxLength: HACKATHON_TEXT_LIMITS.oneLiner,
  },
];

/** 링크 입력 필드 */
export const LINK_FIELDS: readonly TextFieldConfig[] = [
  {
    key: "githubUrl",
    label: "GitHub 저장소 링크",
    isRequired: true,
    placeholder: "https://github.com/계정/저장소",
    hint: "GitHub 저장소는 반드시 public 으로 설정해 주세요",
  },
  {
    key: "deployUrl",
    label: "배포 링크",
    isRequired: false,
    placeholder: "https://",
    hint: "배포 링크 또는 시연 자료 링크 중 하나는 꼭 필요해요",
  },
  {
    key: "demoUrl",
    label: "시연 자료 링크",
    isRequired: false,
    placeholder: "https://",
    hint: "영상·슬라이드·Figma 등 — 링크 공개 범위를 '링크가 있는 모든 사용자'로 열어 주세요",
  },
  {
    key: "prdUrl",
    label: "PRD·기획 문서 링크 (선택)",
    isRequired: false,
    placeholder: "https://",
    hint: "Notion·Google Docs 등 별도 기획 문서가 있다면 넣어 주세요",
  },
];

/** 기획 문서 입력 필드 */
export const PLAN_FIELDS: readonly TextFieldConfig[] = [
  {
    key: "planPurpose",
    label: "목적",
    isRequired: true,
    placeholder: "누구의 어떤 문제를 풀기 위한 프로그램인가요?",
    maxLength: HACKATHON_TEXT_LIMITS.plan,
  },
  {
    key: "planFeatures",
    label: "핵심 기능 · 비즈니스 로직",
    isRequired: true,
    placeholder: "주요 기능과 동작 방식을 적어 주세요.",
    maxLength: HACKATHON_TEXT_LIMITS.plan,
  },
  {
    key: "planExpected",
    label: "예상 결과",
    isRequired: true,
    placeholder: "이 프로그램으로 무엇이 달라지나요?",
    maxLength: HACKATHON_TEXT_LIMITS.plan,
  },
];
