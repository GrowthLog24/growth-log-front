import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityCategorySection } from "@/presentation/components/activity";
import { getTrackSections } from "../_shared/activityTracks";

/** 이 트랙에서 다루는 내용 (Activity에서 이동해 온 두 갈래) */
const CURRICULUM = [
  {
    icon: Bot,
    title: "AI 개발 특강",
    description:
      "Claude Code·Cursor·Copilot로 실무처럼 개발하기. AI 에이전트, RAG, 바이브코딩 실습.",
    tags: ["Claude Code", "에이전트", "MCP"],
  },
  {
    icon: Briefcase,
    title: "개발/커리어 세미나",
    description:
      "현직자 초청 특강, 이직·포트폴리오·연봉협상까지. 그로스톡에서 이어온 커리어 콘텐츠.",
    tags: ["현직자 특강", "포트폴리오", "이직"],
  },
] as const;

export const metadata: Metadata = {
  title: "Dev×AI",
  description:
    "AI를 무기로 쓰는 개발자가 되는 곳. 그로스로그의 AI·개발 전문가 특강과 개발/커리어 세미나를 한 트랙에 모았습니다.",
};

/** 매 요청마다 최신 데이터 조회 */
export const dynamic = "force-dynamic";

export default async function DevAiPage() {
  const sections = await getTrackSections("dev-ai");

  return (
    <>
      <section className="section-padding bg-white">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            DEV × AI
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            AI를 무기로 쓰는 개발자가 되는 곳
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            기존 Activity의 AI·개발 전문가 특강과 개발/커리어 세미나를 한 트랙으로 모았습니다.
            소속과 관계없이 참여할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Curriculum */}
      <section className="section-padding bg-gray-6">
        <div className="container-custom">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-3">
            CURRICULUM
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">무엇을 배우나요</h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {CURRICULUM.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-white p-7"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-6 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {sections.map((section, index) => (
        <ActivityCategorySection
          key={section.category}
          category={section.category}
          activities={section.activities}
          isOdd={index % 2 === 1}
        />
      ))}

      {/* CTA */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="rounded-3xl bg-primary px-8 py-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              AI 개발, 어디서부터 시작할지 막막하다면
            </h2>
            <p className="mt-3 text-white/85">Dev×AI 트랙에서 함께 시작하세요.</p>
            <Button
              asChild
              size="lg"
              className="mt-7 text-base bg-white text-primary hover:bg-white/90"
            >
              <Link href="/recruit">6기 신청하기</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
