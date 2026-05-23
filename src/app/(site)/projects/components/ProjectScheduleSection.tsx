import Link from "next/link";
import { ClipboardList, Rocket, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectScheduleSectionProps {
  /** 참여 신청 CTA 링크 (구글폼 등). 헤더 CTA와 동일한 siteConfig 값을 사용 */
  applyLink: string;
}

interface Milestone {
  label: string;
  date: string;
  note?: string;
}

interface SchedulePhase {
  title: string;
  duration: string;
  icon: typeof ClipboardList;
  milestones: Milestone[];
}

const PHASES: SchedulePhase[] = [
  {
    title: "프로젝트 등록 및 홍보",
    duration: "5주",
    icon: ClipboardList,
    milestones: [
      { label: "등록 신청", date: "26-05-14 (목) ~ 26-05-29 (금)", note: "16일간" },
      { label: "리더 OT", date: "26-05-30 (토) 21:00", note: "온라인 참석 필수" },
      { label: "프로젝트 홍보", date: "26-05-31 (일) ~ 26-06-19 (토)", note: "3주간" },
    ],
  },
  {
    title: "프로젝트 운영",
    duration: "6주",
    icon: Rocket,
    milestones: [
      { label: "팀 빌딩", date: "26-06-20 (토)", note: "오프라인 정기모임" },
      { label: "중간 발표", date: "26-07-18 (토)", note: "오프라인 그로스톡" },
      { label: "최종 발표", date: "26-08-01 (토)", note: "오프라인 정기모임" },
    ],
  },
];

const SPECIAL_EVENT: Milestone = {
  label: "SW 경진대회 출전 행사",
  date: "26-08-29 (토) ~ 30 (일)",
};

const APPLY_CTA_TEXT = "5기 프로젝트 참여 신청";

function isExternalLink(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/**
 * 5기 프로젝트 일정 섹션 (정적)
 * /projects 페이지 최상단에 노출되며 참여 신청 CTA를 포함한다.
 */
export function ProjectScheduleSection({ applyLink }: ProjectScheduleSectionProps) {
  const external = isExternalLink(applyLink);

  return (
    <section className="py-16 bg-gradient-to-b from-primary/5 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-3">
            5TH PROJECT
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            5기 프로젝트 일정
          </h2>
          <p className="mt-2 text-muted-foreground">
            등록부터 최종 발표까지, 5기 프로젝트의 전체 여정
          </p>
        </div>

        {/* Phases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PHASES.map((phase) => (
            <div
              key={phase.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-primary/10"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <phase.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{phase.title}</h3>
                  <span className="text-sm text-primary font-medium">
                    {phase.duration}
                  </span>
                </div>
              </div>

              <ul className="space-y-4">
                {phase.milestones.map((m) => (
                  <li
                    key={m.label}
                    className="relative pl-4 border-l-2 border-primary/20"
                  >
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                    <p className="font-medium text-foreground">{m.label}</p>
                    <p className="text-sm text-muted-foreground">{m.date}</p>
                    {m.note && (
                      <span className="inline-block mt-1 text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        {m.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Special Event */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl p-6 bg-gray-2 text-white">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">{SPECIAL_EVENT.label}</p>
            <p className="text-white/80">{SPECIAL_EVENT.date}</p>
          </div>
        </div>

        {/* CTA */}
        {applyLink && (
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              {external ? (
                <a href={applyLink} target="_blank" rel="noopener noreferrer">
                  {APPLY_CTA_TEXT}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              ) : (
                <Link href={applyLink}>
                  {APPLY_CTA_TEXT}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
