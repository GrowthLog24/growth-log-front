import Link from "next/link";
import {
  Bot,
  GraduationCap,
  Wrench,
  NotebookPen,
  Users,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

/** 6개 활동 트랙 - 관심사 기준으로 진입점을 나눠 첫 방문자가 자기 자리를 찾게 합니다. */
const TRACKS = [
  {
    href: "/dev-ai",
    icon: Bot,
    title: "Dev×AI",
    description: "AI 개발 특강 · 개발/커리어 세미나",
    tag: "신규 트랙",
  },
  {
    href: "/knou-cs",
    icon: GraduationCap,
    title: "KNOU CS",
    description: "전공 스터디 · 기출 CBT · 학사 공지",
    tag: "전공생 필수",
  },
  {
    href: "/projects",
    icon: Wrench,
    title: "Project",
    description: "월간 프로젝트 · 수익화 · 경진대회",
    tag: "범위 확장",
  },
  {
    href: "/activity",
    icon: NotebookPen,
    title: "성장일지",
    description: "5기까지 이어온 성장 큐레이션",
    tag: "Activity",
  },
  {
    href: "/activity",
    icon: Users,
    title: "클럽 활동",
    description: "오프라인 모임 · 네트워킹 · 취미",
    tag: "Activity",
  },
  {
    href: "/support",
    icon: MessageCircle,
    title: "Support",
    description: "공지 · FAQ · 운영 문의",
    tag: "문의",
  },
] as const;

export function TrackExploreSection() {
  return (
    <section className="section-padding bg-gray-6">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            EXPLORE
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            6개의 활동 트랙
          </h2>
          <p className="mt-4 text-muted-foreground">관심사에 맞게 골라 참여하세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRACKS.map((track) => (
            <Link
              key={track.title}
              href={track.href}
              className="group flex flex-col rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <track.icon className="h-6 w-6 text-primary" />
              </span>
              <h3 className="text-lg font-bold text-foreground">{track.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{track.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {track.tag}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
