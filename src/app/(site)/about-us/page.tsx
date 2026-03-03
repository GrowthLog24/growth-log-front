import type { Metadata } from "next";
import Image from "next/image";
import {
  Flame,
  Users,
  Lightbulb,
  Calendar,
  Code,
  Presentation,
  BookOpen,
  Coffee,
} from "lucide-react";
import { getStorageUrl, STORAGE_PATHS } from "@/shared/utils";

export const metadata: Metadata = {
  title: "About Us",
  description: "그로스로그를 소개합니다. 함께 성장하는 IT 커뮤니티입니다.",
};

// 소개 아이템
const introItems = [
  {
    icon: Flame,
    title: "그로스로그는 4가지의 다양한 활동을 통해 함께 성장합니다",
    description:
      "스터디부터 프로젝트, 특강까지! 다양한 분야에서 함께 배우고 성장하세요.",
  },
  {
    icon: Users,
    title: "그로스로그는 운영진이 직접 멘토링을 지원합니다",
    description:
      "현업에서 활동 중인 운영진들이 직접 멘토링을 진행합니다.",
  },
  {
    icon: Lightbulb,
    title: "그로스로그는 매기 활동 후 회고, 발표, 네트워킹을 진행합니다",
    description:
      "정기 모임을 통해 배움을 공유하고 네트워크를 넓혀가세요.",
  },
];

// 월별 일정
const scheduleItems = [
  { month: "1월", title: "신년 프로그램", icon: Calendar },
  { month: "2-3월", title: "정규 스터디", icon: BookOpen },
  { month: "4월", title: "프로젝트 시작", icon: Code },
  { month: "5-6월", title: "프로젝트 진행", icon: Code },
  { month: "7월", title: "프로젝트 발표", icon: Presentation },
];

// 통계
const stats = [
  { label: "운영 기간", value: "2년", suffix: "" },
  { label: "현재 활동 회원", value: "65", suffix: "명" },
  { label: "프로젝트", value: "10", suffix: "개" },
  { label: "누적 기수", value: "4", suffix: "기" },
  { label: "누적 멤버", value: "270", suffix: "명" },
  { label: "성장일지 발행", value: "950", suffix: "+" },
];

export default function AboutUsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-accent rounded-full text-sm font-medium text-primary mb-4">
              INTRODUCTION OF OUR COMMUNITY
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              우리를 소개합니다
            </h1>
          </div>

          {/* Intro Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {introItems.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              2025 SEMESTER PROGRAM
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              5기 월별 일정 소개
            </h2>
          </div>

          {/* Timeline */}
          <div className="flex flex-wrap justify-center gap-6">
            {scheduleItems.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm min-w-[140px]"
              >
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary mb-1">
                  {item.month}
                </span>
                <span className="text-sm text-muted-foreground text-center">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-accent rounded-full text-sm font-medium text-primary mb-4">
              GROWTH LOG DATA
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              그로스로그는 지금도 성장 중!
            </h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-6 bg-gray-6 rounded-xl"
              >
                <span className="text-sm text-muted-foreground mb-2">
                  {stat.label}
                </span>
                <span className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                  <span className="text-lg">{stat.suffix}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Photo Section */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-gray-4">
            <Image
              src={getStorageUrl(STORAGE_PATHS.TEAM_PHOTO)}
              alt="그로스로그 단체사진"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-sm opacity-80">그로스로그 4기</p>
              <h3 className="text-2xl font-bold">함께 성장하는 우리</h3>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
