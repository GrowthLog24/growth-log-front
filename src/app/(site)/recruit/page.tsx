import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Phone, Mail, Clock, CreditCard, Users, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";

export const metadata: Metadata = {
  title: "Recruit",
  description: "그로스로그 멤버를 모집합니다. 함께 성장할 분들을 기다립니다.",
};

// Mock data - Firebase 연동 후 실제 데이터로 교체
const recruitmentDetails = {
  deadline: "2025년 3월 31일",
  contactPhone: "010-1234-5678",
  contactEmail: "recruit@growth-log.com",
  feeAmount: 50000,
  otSchedules: [
    { round: 1, date: "2025.04.05 (토)", time: "16:00", location: "공덕역 인근" },
    { round: 2, date: "2025.04.12 (토)", time: "16:00", location: "공덕역 인근" },
    { round: 3, date: "2025.04.19 (토)", time: "16:00", location: "공덕역 인근" },
  ],
};

export default async function RecruitPage() {
  // Firebase에서 모집 설정 가져오기
  const siteConfig = await siteConfigRepository.getSiteConfig();

  const isRecruitmentOpen = siteConfig?.isRecruitmentOpen ?? false;
  const recruitmentGeneration = siteConfig?.recruitmentGeneration ?? 1;
  const recruitmentFormLink = siteConfig?.recruitmentFormLink ?? "";

  // 모집 종료 시 다음 기수
  const nextGeneration = recruitmentGeneration + 1;

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
                  {recruitmentGeneration}기 신청서 기간 안내
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">지원 마감</p>
                  <p className="font-medium">{recruitmentDetails.deadline}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">문의</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{recruitmentDetails.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{recruitmentDetails.contactEmail}</span>
                  </div>
                </div>
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
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  * 세 번의 OT 중 한 번만 참석하시면 됩니다.
                </p>
                <div className="space-y-3">
                  {recruitmentDetails.otSchedules.map((ot) => (
                    <div
                      key={ot.round}
                      className="flex items-center gap-4 p-3 bg-gray-6 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                        {ot.round}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{ot.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {ot.time} · {ot.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 등록금 안내 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {recruitmentGeneration}기 등록금 안내
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">참여비</p>
                  <p className="text-2xl font-bold text-primary">
                    {recruitmentDetails.feeAmount.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">포함 내역</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>· 스터디/프로젝트 참여</li>
                    <li>· 전문가 특강 참석</li>
                    <li>· 정규 모임 참석</li>
                    <li>· 네트워킹 행사 참여</li>
                  </ul>
                </div>
                <div className="p-3 bg-accent rounded-lg">
                  <p className="text-sm font-medium">입금 계좌</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    카카오뱅크 3333-01-1234567 (그로스로그)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 정규 모임 안내 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {recruitmentGeneration}기 정규 모임 안내
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">정규 모임 일시</p>
                  <p className="font-medium">매주 토요일 14:00 - 17:00</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">장소</p>
                  <p className="font-medium">공덕역 인근 스터디 카페</p>
                </div>
                <div className="p-3 bg-gray-6 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 정규 모임은 온/오프라인 병행으로 진행되며, 불참 시 사전 공지가 필요합니다.
                  </p>
                </div>
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
