import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Mail, Clock, CreditCard, Users, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownContent } from "@/presentation/components/common";
import { KakaoMessageCopyCard } from "@/presentation/components/recruit/KakaoMessageCopyCard";
import { BankAccountCard } from "@/presentation/components/recruit/BankAccountCard";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { recruitmentRepository } from "@/infrastructure/repositories/recruitmentRepository";
import { formatDateKorean, formatDateWithDay } from "@/shared/utils/date";

export const metadata: Metadata = {
  title: "Recruit",
  description: "그로스로그 멤버를 모집합니다. 함께 성장할 분들을 기다립니다.",
};

export default async function RecruitPage() {
  // Firebase에서 모집 설정 가져오기
  const siteConfig = await siteConfigRepository.getSiteConfig();

  const isRecruitmentOpen = siteConfig?.isRecruitmentOpen ?? false;
  const currentGeneration = siteConfig?.currentGeneration ?? 0;
  const recruitmentGeneration = siteConfig?.recruitmentGeneration ?? 1;
  const recruitmentFormLink = siteConfig?.recruitmentFormLink ?? "";

  // 모집 중일 때 실제 모집 정보 가져오기
  const recruitment = isRecruitmentOpen
    ? await recruitmentRepository.getRecruitmentByGeneration(recruitmentGeneration)
    : null;

  // 모집 종료 시 다음 기수 (현재 기수 + 1)
  const nextGeneration = currentGeneration + 1;

  // 모집 종료 상태일 때
  if (!isRecruitmentOpen) {
    return (
      <>
        {/* Hero Section - 모집 마감 */}
        <section className="section-padding bg-gray-2 text-white">
          <div className="container-custom">
            <div className="text-center">
              <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
                RECRUITMENT CLOSED
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                그로스로그 {recruitmentGeneration}기 모집 마감
              </h1>
              <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
                다음 기수 모집 알림을 받아보세요. 사전 등록하시면 모집 시작 시 가장 먼저 안내해 드립니다.
              </p>
              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-gray-2 hover:bg-white/90"
                >
                  <Link href="/pre-register">
                    <Bell className="mr-2 h-5 w-5" />
                    {nextGeneration}기 사전 등록하기
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 안내 섹션 */}
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                현재 모집이 마감되었습니다
              </h2>
              <p className="mt-4 text-muted-foreground">
                {recruitmentGeneration}기 모집이 종료되었습니다. {nextGeneration}기 모집 소식을 가장 먼저 받아보시려면 사전 등록을 해주세요.
              </p>
              <div className="mt-8 p-6 bg-white border border-gray-5 rounded-2xl text-left max-w-md mx-auto">
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
          </div>
        </section>

        {/* Image Section */}
        <section className="section-padding bg-gray-6">
          <div className="container-custom">
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-gray-4">
              <Image
                src={getStorageUrl(STORAGE_PATHS.RECRUIT_PHOTO)}
                alt="그로스로그 활동"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-white">
          <div className="container-custom text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              함께 성장할 준비가 되셨나요?
            </h2>
            <p className="mt-4 text-muted-foreground">
              {nextGeneration}기 모집 알림을 받아보세요.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/pre-register">
                  {nextGeneration}기 사전 등록하기
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </>
    );
  }

  // 모집 중 상태일 때
  return (
    <>
      {/* Hero Section */}
      <section className="section-padding bg-primary text-white">
        <div className="container-custom">
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
              NOW RECRUITING
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              그로스로그 {recruitmentGeneration}기 모집 안내
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              함께 성장하고 싶은 분들을 기다립니다. 다양한 분야의 사람들과 교류하며 새로운 인사이트를 얻어가세요.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                <a href={recruitmentFormLink} target="_blank" rel="noopener noreferrer">
                  {recruitmentGeneration}기 지원서 작성하기
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Info Grid */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 신청서 안내 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {recruitmentGeneration}기 신입회원 가입 안내
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">지원 마감</p>
                  <p className="font-medium">
                    {recruitment?.deadlineAt
                      ? formatDateKorean(recruitment.deadlineAt)
                      : "미정"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">문의</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{recruitment?.contactEmail || "미정"}</span>
                  </div>
                </div>
                {recruitment?.applyGuideMd && (
                  <div className="pt-2 border-t">
                    <MarkdownContent content={recruitment.applyGuideMd} className="text-sm" />
                  </div>
                )}
                {recruitment?.kakaoMessageTemplate && (
                  <div className="pt-2 border-t">
                    <KakaoMessageCopyCard message={recruitment.kakaoMessageTemplate} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OT 안내 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {recruitmentGeneration}기 OT 안내
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recruitment?.otGuideMd && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {recruitment.otGuideMd}
                  </p>
                )}
                {!recruitment?.otGuideMd && (
                  <p className="text-sm text-muted-foreground">
                    * 세 번의 OT 중 한 번만 참석하시면 됩니다.
                  </p>
                )}
                <div className="space-y-3">
                  {(recruitment?.otSchedules || []).map((ot) => (
                    <div
                      key={ot.round}
                      className="flex items-center gap-4 p-3 bg-gray-6 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                        {ot.round}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {ot.dateAt ? formatDateWithDay(ot.dateAt) : "미정"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ot.timeText} · {ot.locationText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {recruitment?.otLocationMd && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">OT 장소 안내</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {recruitment.otLocationMd}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 등록금 안내 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {recruitmentGeneration}기 등록 입금 안내
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">총 납부 금액</p>
                  <p className="text-2xl font-bold text-primary">
                    {(recruitment?.feeAmount ?? 0).toLocaleString()}원
                  </p>
                </div>
                {recruitment?.feeDetailMd && (
                  <div>
                    <p className="text-sm text-muted-foreground">회비 상세 내역</p>
                    <p className="mt-2 text-sm whitespace-pre-line">
                      {recruitment.feeDetailMd}
                    </p>
                  </div>
                )}
                <BankAccountCard bankAccountText={recruitment?.bankAccountText || "미정"} />
                {recruitment?.feeDescriptionMd && (
                  <div className="pt-2 border-t">
                    <p className="text-sm whitespace-pre-line">
                      {recruitment.feeDescriptionMd}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 정규 모임 안내 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {recruitmentGeneration}기 정기 모임 안내
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recruitment?.firstMeetingAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">첫 정기 모임</p>
                    <p className="font-medium">
                      {formatDateKorean(recruitment.firstMeetingAt)}
                    </p>
                  </div>
                )}
                {recruitment?.regularMeetingsMd && (
                  <div>
                    <p className="text-sm text-muted-foreground">정기 모임 일정</p>
                    <p className="mt-1 text-sm whitespace-pre-line">
                      {recruitment.regularMeetingsMd}
                    </p>
                  </div>
                )}
                {recruitment?.activityScheduleMd && (
                  <div>
                    <p className="text-sm text-muted-foreground">월별 활동 일정</p>
                    <p className="mt-1 text-sm whitespace-pre-line">
                      {recruitment.activityScheduleMd}
                    </p>
                  </div>
                )}
                {recruitment?.meetingGuideMd && (
                  <div className="pt-2 border-t">
                    <p className="text-sm whitespace-pre-line">
                      {recruitment.meetingGuideMd}
                    </p>
                  </div>
                )}
                {!recruitment?.regularMeetingsMd && !recruitment?.firstMeetingAt && !recruitment?.activityScheduleMd && (
                  <p className="text-sm text-muted-foreground">
                    정기 모임 정보가 아직 등록되지 않았습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Image Section */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-gray-4">
            <Image
              src={getStorageUrl(STORAGE_PATHS.RECRUIT_PHOTO)}
              alt="그로스로그 활동"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-white">
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            함께 성장할 준비가 되셨나요?
          </h2>
          <p className="mt-4 text-muted-foreground">
            그로스로그 {recruitmentGeneration}기와 함께 새로운 도전을 시작하세요.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <a href={recruitmentFormLink} target="_blank" rel="noopener noreferrer">
                지금 지원하기
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
