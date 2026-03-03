"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle } from "lucide-react";
import type { PreRegistrationField } from "@/domain/entities";

interface PreRegistrationFormProps {
  generation: number;
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  fields?: PreRegistrationField[];
}

// Fallback 필드 - Firestore 설정이 없을 때 사용
const defaultFields: PreRegistrationField[] = [
  {
    id: "name",
    type: "text",
    label: "이름",
    placeholder: "이름을 입력해주세요",
    required: true,
    order: 1,
  },
  {
    id: "email",
    type: "email",
    label: "이메일",
    placeholder: "이메일을 입력해주세요",
    required: true,
    order: 2,
  },
  {
    id: "phone",
    type: "phone",
    label: "연락처",
    placeholder: "010-0000-0000",
    required: true,
    order: 3,
  },
  {
    id: "job",
    type: "text",
    label: "직무",
    placeholder: "현재 직무를 입력해주세요",
    required: true,
    order: 4,
  },
  {
    id: "motivation",
    type: "textarea",
    label: "지원 동기",
    placeholder: "그로스로그에 관심을 갖게 된 이유를 알려주세요",
    required: false,
    order: 5,
  },
];

export function PreRegistrationForm({
  generation,
  trigger,
  title,
  description,
  fields,
}: PreRegistrationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formFields = fields || defaultFields;
  const sortedFields = [...formFields].sort((a, b) => a.order - b.order);

  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // 입력 시 에러 제거
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of sortedFields) {
      const value = formData[field.id]?.trim() || "";

      if (field.required && !value) {
        newErrors[field.id] = `${field.label}을(를) 입력해주세요`;
      }

      if (field.type === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = "올바른 이메일 형식이 아닙니다";
        }
      }

      if (field.type === "phone" && value) {
        const phoneRegex = /^[\d\-+() ]+$/;
        if (!phoneRegex.test(value)) {
          newErrors[field.id] = "올바른 연락처 형식이 아닙니다";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/pre-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation,
          formData,
        }),
      });

      if (!response.ok) {
        throw new Error("제출에 실패했습니다");
      }

      setIsSuccess(true);
    } catch (error) {
      console.error("Pre-registration error:", error);
      setErrors({ _form: "제출에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // 닫을 때 상태 초기화
      setFormData({});
      setErrors({});
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              사전등록이 완료되었습니다!
            </h3>
            <p className="text-muted-foreground mb-6">
              {generation}기 모집이 시작되면 안내해 드릴게요.
            </p>
            <Button onClick={() => setIsOpen(false)}>확인</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {title || `${generation}기 사전등록`}
              </DialogTitle>
              <DialogDescription>
                {description ||
                  `${generation}기 모집이 시작되면 가장 먼저 안내해 드립니다.`}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {sortedFields.map((field) => (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </label>

                  {field.type === "textarea" ? (
                    <textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  ) : field.type === "select" && field.options ? (
                    <select
                      id={field.id}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">선택해주세요</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "email" ? "email" : "text"}
                      id={field.id}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}

                  {errors[field.id] && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors[field.id]}
                    </p>
                  )}
                </div>
              ))}

              {errors._form && (
                <p className="text-sm text-destructive text-center">
                  {errors._form}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    제출 중...
                  </>
                ) : (
                  "사전등록 하기"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
