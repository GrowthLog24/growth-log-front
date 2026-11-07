"use client";

import { useMemo, useState } from "react";
import {
  normalizeSubmissionInput,
  validateSubmission,
  type SubmissionErrors,
} from "@/domain/hackathon/rules";
import type {
  HackathonSubmission,
  HackathonSubmissionInput,
  HackathonTrack,
} from "@/domain/hackathon/types";
import { submitSubmission, type TeamAuth } from "./submitApi";
import { FIELD_ORDER, fieldDomId } from "./submissionFields";

/** 폼 값: 트랙은 선택 전 빈 문자열을 허용 */
export type SubmissionFormValues = Omit<HackathonSubmissionInput, "track"> & {
  track: HackathonTrack | "";
};

type InputKey = keyof HackathonSubmissionInput;

const EMPTY_VALUES: SubmissionFormValues = {
  projectName: "",
  track: "",
  githubUrl: "",
  oneLiner: "",
  deployUrl: "",
  demoUrl: "",
  planPurpose: "",
  planFeatures: "",
  planExpected: "",
  prdUrl: "",
};

function toInitialValues(submission: HackathonSubmission | null): SubmissionFormValues {
  if (!submission) return EMPTY_VALUES;
  // 제출 문서에서 입력 필드만 골라냅니다 (메타 필드 제외).
  return normalizeSubmissionInput(submission);
}

function focusFirstError(errors: SubmissionErrors): void {
  const firstKey = FIELD_ORDER.find((key) => errors[key]);
  if (!firstKey) return;
  document.getElementById(fieldDomId(firstKey))?.focus();
}

/**
 * 제출 폼 상태·검증·전송을 관리합니다.
 *
 * @param {object} params - 팀 인증, 기존 제출물, 성공·인증 만료 콜백
 * @returns 폼 값, 표시할 오류, 전송 상태와 핸들러
 */
export function useSubmissionForm(params: {
  auth: TeamAuth;
  initial: HackathonSubmission | null;
  onSubmitted: (submission: HackathonSubmission) => void;
  onAuthExpired: () => void;
}) {
  const { auth, initial, onSubmitted, onAuthExpired } = params;
  const [values, setValues] = useState<SubmissionFormValues>(() => toInitialValues(initial));
  const [shouldShowErrors, setShouldShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<SubmissionErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const clientErrors = useMemo(
    () => validateSubmission(normalizeSubmissionInput(values)),
    [values]
  );
  const errors: SubmissionErrors = shouldShowErrors ? { ...serverErrors, ...clientErrors } : {};

  const setField = (key: InputKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setServerErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async () => {
    setShouldShowErrors(true);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) {
      focusFirstError(clientErrors);
      return;
    }
    setIsPending(true);
    const result = await submitSubmission(auth, normalizeSubmissionInput(values));
    setIsPending(false);
    if (result.ok) {
      onSubmitted(result.data.submission);
      return;
    }
    if (result.status === 401) {
      onAuthExpired();
      return;
    }
    setFormError(result.error);
    setServerErrors(result.errors ?? {});
    if (result.errors) focusFirstError(result.errors);
  };

  return { values, errors, formError, isPending, setField, submit };
}
