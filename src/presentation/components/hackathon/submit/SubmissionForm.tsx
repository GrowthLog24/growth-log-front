"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUBMISSION_CLOSED_MESSAGE } from "@/app/api/hackathon/submit/submitPolicy";
import type { SubmissionErrors } from "@/domain/hackathon/rules";
import type { HackathonSubmission } from "@/domain/hackathon/types";
import { FormField } from "./FormField";
import { TrackPicker } from "./TrackPicker";
import type { TeamAuth } from "./submitApi";
import { BASIC_FIELDS, LINK_FIELDS, PLAN_FIELDS, fieldDomId, type TextFieldConfig } from "./submissionFields";
import { useSubmissionForm, type SubmissionFormValues } from "./useSubmissionForm";

interface SubmissionFormProps {
  auth: TeamAuth;
  initial: HackathonSubmission | null;
  /** 유예 시간까지 지나 제출이 닫혔는지 */
  isClosed: boolean;
  onSubmitted: (submission: HackathonSubmission) => void;
  onAuthExpired: () => void;
}

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-5 bg-white p-4 sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-bold text-gray-black">
        <span className="flex size-6 items-center justify-center rounded-full bg-green-1 text-xs text-white">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

interface TextFieldProps {
  config: TextFieldConfig;
  values: SubmissionFormValues;
  errors: SubmissionErrors;
  isMultiline: boolean;
  onChange: (key: TextFieldConfig["key"], value: string) => void;
}

function TextField({ config, values, errors, isMultiline, onChange }: TextFieldProps) {
  const value = values[config.key];
  const counter = config.maxLength ? { length: value.length, max: config.maxLength } : undefined;
  return (
    <FormField
      id={fieldDomId(config.key)}
      label={config.label}
      isRequired={config.isRequired}
      hint={config.hint}
      error={errors[config.key]}
      counter={counter}
    >
      {(a11y) =>
        isMultiline ? (
          <Textarea
            {...a11y}
            value={value}
            placeholder={config.placeholder}
            onChange={(event) => onChange(config.key, event.target.value)}
            className="min-h-28 bg-white"
          />
        ) : (
          <Input
            {...a11y}
            type={config.key.endsWith("Url") ? "url" : "text"}
            inputMode={config.key.endsWith("Url") ? "url" : undefined}
            value={value}
            placeholder={config.placeholder}
            onChange={(event) => onChange(config.key, event.target.value)}
            className="h-11 bg-white"
          />
        )
      }
    </FormField>
  );
}

/**
 * 2단계: 제출서 작성 폼. 기존 제출물이 있으면 미리 채웁니다.
 */
export function SubmissionForm({ auth, initial, isClosed, onSubmitted, onAuthExpired }: SubmissionFormProps) {
  const form = useSubmissionForm({ auth, initial, onSubmitted, onAuthExpired });
  const { values, errors, setField } = form;

  // 팀당 1회 제출이라 한 번 더 확인받는다
  const [isConfirming, setIsConfirming] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    setIsConfirming(false);
    void form.submit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Section step={1} title="기본 정보">
        {BASIC_FIELDS.map((config) => (
          <TextField key={config.key} config={config} values={values} errors={errors} isMultiline={false} onChange={setField} />
        ))}
        <TrackPicker value={values.track} error={errors.track} onChange={(track) => setField("track", track)} />
      </Section>

      <Section step={2} title="링크">
        {LINK_FIELDS.map((config) => (
          <TextField key={config.key} config={config} values={values} errors={errors} isMultiline={false} onChange={setField} />
        ))}
      </Section>

      <Section step={3} title="기획 문서">
        {PLAN_FIELDS.map((config) => (
          <TextField key={config.key} config={config} values={values} errors={errors} isMultiline onChange={setField} />
        ))}
      </Section>

      <div className="space-y-3 pb-4">
        {form.formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {form.formError}
          </p>
        )}
        {isClosed && (
          <p role="status" className="rounded-lg bg-gray-6 px-3 py-2 text-sm text-gray-1">
            {SUBMISSION_CLOSED_MESSAGE}
          </p>
        )}
        {isConfirming && (
          <div role="alert" className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <p className="font-semibold">제출은 팀당 1회이고, 제출 후에는 수정할 수 없어요.</p>
            <p>GitHub(public)·배포·시연·PRD 링크와 기획 내용을 다시 확인한 뒤 아래 버튼을 한 번 더 눌러 주세요.</p>
          </div>
        )}
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={form.isPending || isClosed}>
          {form.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {form.isPending ? "제출 중…" : isConfirming ? "확인했어요, 최종 제출하기" : "제출하기"}
        </Button>
        {isConfirming && (
          <Button type="button" variant="ghost" className="w-full" onClick={() => setIsConfirming(false)}>
            다시 검토할게요
          </Button>
        )}
      </div>
    </form>
  );
}
