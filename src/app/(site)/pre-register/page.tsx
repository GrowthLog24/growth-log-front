"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { preRegistrationRepository } from "@/infrastructure/repositories/preRegistrationRepository";
import type { PreRegistrationField } from "@/domain/entities";

export default function PreRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nextGeneration, setNextGeneration] = useState(0);
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false);

  // 폼 필드 상태
  const [formFields, setFormFields] = useState<PreRegistrationField[]>([]);
  const [name, setName] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [config, fields] = await Promise.all([
          siteConfigRepository.getSiteConfig(),
          preRegistrationRepository.getFormFields(),
        ]);

        if (config) {
          setIsRecruitmentOpen(config.isRecruitmentOpen);
          setNextGeneration(config.recruitmentGeneration + 1);

          // 모집 중이면 recruit 페이지로 리다이렉트
          if (config.isRecruitmentOpen) {
            router.replace("/recruit");
            return;
          }
        }

        setFormFields(fields);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    // 필수 필드 검증
    for (const field of formFields) {
      if (field.required && !formData[field.id]?.trim()) {
        toast.error(`${field.label}을(를) 입력해주세요.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await preRegistrationRepository.submitPreRegistration({
        generation: nextGeneration,
        name: name.trim(),
        formData,
      });
      setSubmitted(true);
      toast.success("사전 등록이 완료되었습니다!");
    } catch (error) {
      console.error("Failed to submit:", error);
      toast.error("사전 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: PreRegistrationField) => {
    const value = formData[field.id] || "";

    switch (field.type) {
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            disabled={submitting}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "선택해주세요"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={submitting}
            className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || "example@email.com"}
            disabled={submitting}
          />
        );

      case "phone":
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || "010-0000-0000"}
            disabled={submitting}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={submitting}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 제출 완료 화면
  if (submitted) {
    return (
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">사전 등록 완료!</h2>
              <p className="text-muted-foreground mb-6">
                {nextGeneration}기 모집이 시작되면 가장 먼저 알려드릴게요.
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                홈으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="section-padding bg-gray-2 text-white">
        <div className="container-custom">
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
              PRE-REGISTRATION
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              그로스로그 {nextGeneration}기 사전 등록
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              다음 기수 모집 알림을 받아보세요.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                사전 등록하기
              </CardTitle>
              <CardDescription>
                {nextGeneration}기 모집이 시작되면 알림을 보내드립니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 기본 필드: 이름 */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    이름 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="이름을 입력해주세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {/* 동적 필드 */}
                {formFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      {nextGeneration}기 사전 등록하기
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 혜택 안내 */}
          <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-2xl">
            <h3 className="font-semibold text-lg mb-4">사전 등록 혜택</h3>
            <ul className="text-muted-foreground space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>모집 시작 알림 우선 발송</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>모집 일정 사전 안내</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>그로스로그 소식 업데이트</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
