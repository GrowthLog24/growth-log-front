import Link from "next/link";
import {
  ClipboardList,
  Rocket,
  Megaphone,
  Users,
  Trophy,
  User,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectScheduleSectionProps {
  applyLink: string;
}

interface Milestone {
  label: string;
  date: string;
  note: string;
  icon: typeof Megaphone;
}

interface SchedulePhase {
  step: string;
  title: string;
  duration: string;
  headerIcon: typeof ClipboardList;
  milestones: Milestone[];
}

const PHASES: SchedulePhase[] = [
  {
    step: "01",
    title: "프로젝트 등록 및 홍보",
    duration: "5주",
    headerIcon: ClipboardList,
    milestones: [
      {
        label: "등록 신청",
        date: "26-05-14 (목) ~ 26-05-29 (금)",
        note: "16일간",
        icon: Megaphone,
      },
      {
        label: "리더 OT",
        date: "26-05-30 (토) 21:00",
        note: "온라인 참석 필수",
        icon: User,
      },
      {
        label: "프로젝트 홍보",
        date: "26-05-31 (일) ~ 26-06-19 (토)",
        note: "3주간",
        icon: Megaphone,
      },
    ],
  },
  {
    step: "02",
    title: "프로젝트 운영",
    duration: "6주",
    headerIcon: Rocket,
    milestones: [
      {
        label: "팀 빌딩",
        date: "26-06-20 (토)",
        note: "오프라인 정기모임",
        icon: Users,
      },
      {
        label: "중간 발표",
        date: "26-07-18 (토)",
        note: "오프라인 그로스톡",
        icon: FileText,
      },
      {
        label: "최종 발표",
        date: "26-08-01 (토)",
        note: "오프라인 정기모임",
        icon: Trophy,
      },
    ],
  },
];

const SPECIAL_EVENT = {
  label: "SW 경진대회 출전 행사",
  date: "26-08-29 (토) ~ 30 (일)",
};

function isExternalLink(href: string): boolean {
  return /^https?:\/\//.test(href);
}

export function ProjectScheduleSection({ applyLink }: ProjectScheduleSectionProps) {
  const external = isExternalLink(applyLink);

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-stone-100 to-stone-50">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block text-sm font-medium text-stone-600 bg-white rounded-full px-4 py-1.5 mb-3">5TH PROJECT</span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              프로젝트 일정
            </h2>
          </div>
          {applyLink && (
            <Button asChild className="bg-stone-800 hover:bg-stone-900">
              {external ? (
                <a href={applyLink} target="_blank" rel="noopener noreferrer">
                  5기 프로젝트 참여 신청
                </a>
              ) : (
                <Link href={applyLink}>
                  5기 프로젝트 참여 신청
                </Link>
              )}
            </Button>
          )}
        </div>

        {/* Phases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {PHASES.map((phase) => (
            <div key={phase.step}>
              {/* Phase Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold text-foreground">
                    {phase.step}
                  </p>
                  <h3 className="font-semibold text-foreground">{phase.title}</h3>
                  <span className="text-xs font-medium text-stone-600 bg-white rounded-full px-3 py-1">
                    {phase.duration}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <phase.headerIcon className="w-5 h-5 text-stone-500" />
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-stone-300 mb-6" />

              {/* Milestones */}
              <ul className="space-y-3">
                {phase.milestones.map((m) => (
                  <li key={m.label}>
                    {/* Pill Card */}
                    <div className="flex items-center gap-4 bg-white rounded-full py-3 px-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <m.icon className="w-4 h-4 text-stone-500" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{m.label}</p>
                        <p className="text-sm text-muted-foreground">{m.date}</p>
                      </div>

                      {/* Note Chip */}
                      <span className="text-xs font-medium text-stone-600 bg-stone-100 rounded-full px-3 py-1 whitespace-nowrap flex-shrink-0">
                        {m.note}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Special Event */}
        <div className="mt-8 flex items-center gap-4 bg-stone-800 text-white rounded-full py-4 px-5">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{SPECIAL_EVENT.label}</p>
            <p className="text-sm text-white/70">{SPECIAL_EVENT.date}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
