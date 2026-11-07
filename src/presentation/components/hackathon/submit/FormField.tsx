"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** 입력 요소에 연결할 접근성 속성 */
export interface FieldA11y {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  isRequired: boolean;
  hint?: string;
  error?: string;
  /** 글자 수 카운터 (현재/최대) */
  counter?: { length: number; max: number };
  children: (a11y: FieldA11y) => ReactNode;
}

/**
 * 라벨·도움말·오류·글자 수를 묶은 폼 필드 래퍼.
 * 입력 요소는 render prop으로 받아 id·aria 속성을 연결합니다.
 */
export function FormField({ id, label, isRequired, hint, error, counter, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  const isOver = counter != null && counter.length > counter.max;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-semibold text-gray-black">
          {label}
          {isRequired && (
            <span className="text-green-1" aria-hidden>
              *
            </span>
          )}
        </Label>
        {counter && (
          <span className={cn("text-xs tabular-nums", isOver ? "text-red-600" : "text-gray-2")}>
            {counter.length}/{counter.max}
          </span>
        )}
      </div>
      {children({ id, "aria-invalid": error != null, "aria-describedby": describedBy })}
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-gray-1">
          {hint}
        </p>
      )}
    </div>
  );
}
