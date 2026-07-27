import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileQuestion, Trophy } from "lucide-react";
import { ActivityCategorySection } from "@/presentation/components/activity";
import { getTrackSections } from "../_shared/activityTracks";

export const metadata: Metadata = {
  title: "KNOU CS",
  description:
    "방송대 컴퓨터과학과 전공생을 위한 트랙. 학사 공지, 전공 스터디, 기출 CBT, SW 경진대회를 한 페이지에 모았습니다.",
};

/** 매 요청마다 최신 데이터 조회 */
export const dynamic = "force-dynamic";

/**
 * 학사 공지 예시 데이터
 *
 * KNOU 학사 공지 크롤링은 별도 과제로 분리되어 있습니다.
 * 크롤링 연동 전까지 화면 구성을 보여주기 위한 프로토타입 데이터입니다.
 */
const SAMPLE_NOTICES = [
  { date: "2026.07.20", tag: "수강신청", title: "2학기 수강신청 안내 — 기간 및 유의사항" },
  { date: "2026.07.15", tag: "시험", title: "1학기 기말시험 성적 확인 및 이의신청 안내" },
  { date: "2026.07.08", tag: "출석수업", title: "여름 계절 출석수업 시간표 공지" },
] as const;

/** 기출문제 CBT 안내 항목 (별도 프로그램으로 운영, 이 페이지에서는 안내만) */
const CBT_ITEMS = ["과목별 기출문제 풀이", "실전 모의 CBT", "오답 노트"] as const;

export default async function KnouCsPage() {
  const sections = await getTrackSections("knou-cs");

  return (
    <>
      {/* Hero */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            KNOU CS
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            방송대 컴퓨터과학과, 혼자 걷지 않게
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            학사 공지부터 전공 스터디, 기출 CBT, SW 경진대회까지. KNOU CS 전공생을 위한 활동을
            한 페이지에 모았습니다.
          </p>
        </div>
      </section>

      {/* 01 학사 공지 */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-3">
            01 · 학사 공지
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            놓치면 안 되는 학사 일정
          </h2>

          <ul className="mt-8 space-y-3">
            {SAMPLE_NOTICES.map((notice) => (
              <li
                key={notice.title}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-white p-5"
              >
                <span className="text-sm text-muted-foreground tabular-nums">{notice.date}</span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {notice.tag}
                </span>
                <span className="font-medium text-foreground">{notice.title}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm text-muted-foreground">
            ※ 프로토타입 — 실제 배포 시 KNOU 학사 공지 크롤링 자동 연동 예정
          </p>
        </div>
      </section>

      {/* 02 전공 스터디 + 학사 성격의 특강·세미나 (field === "학사") */}
      {sections.map((section, index) => (
        <ActivityCategorySection
          key={section.category}
          category={section.category}
          activities={section.activities}
          isOdd={index % 2 === 0}
        />
      ))}

      <div className="container-custom">
        <p className="text-sm text-muted-foreground">
          ※ 전공 특강(CS)·그로스톡 학사 세미나도 이 트랙으로 통합됩니다.
        </p>
      </div>

      {/* 03 기출문제 · CBT */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-3">
            03 · 기출문제 · CBT
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            기출을 CBT로, 시험처럼 연습
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            과목별 기출문제 풀이와 실전 CBT(컴퓨터 기반 모의시험)를 별도 프로그램으로 운영하고
            있습니다. 스터디원과 함께 오답을 나누며 준비하세요.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {CBT_ITEMS.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm text-foreground"
              >
                <FileQuestion className="h-4 w-4 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 04 SW 경진대회 */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-3">
            04 · Project
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">SW 경진대회 도전</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            KNOU CS 전공생 팀의 SW 경진대회 출전을 지원합니다. 일정과 참가 방법은 Projects
            트랙에서 확인하세요.
          </p>

          <Link
            href="/projects"
            className="group mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-gray-6 px-6 py-4 transition-colors hover:border-primary hover:bg-primary/5"
          >
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">전체 프로젝트 트랙 보기</span>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        </div>
      </section>
    </>
  );
}
