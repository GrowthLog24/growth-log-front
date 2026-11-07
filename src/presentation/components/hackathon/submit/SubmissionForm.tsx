"use client";

import type { FormEvent, ReactNode } from "react";
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={form.isPending || isClosed}>
          {form.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {form.isPending ? "제출 중…" : initial ? "수정 내용 다시 제출하기" : "제출하기"}
        </Button>
      </div>
    </form>
  );
}
