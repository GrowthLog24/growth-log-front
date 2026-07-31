"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const TRACKS = [
  {
    title: "Dev×AI",
    description: "AI 개발 특강과 커리어 세미나로 새로운 개발 방식을 가장 먼저 익힙니다.",
    href: "/dev-ai",
    image: "/images/about/values/ai-native-v2.png",
    imageAlt: "사람과 AI가 하나의 결과물을 함께 완성하는 3D 오브젝트",
    width: "w-[78vw] sm:w-[430px] lg:w-[500px]",
    tone: "text-gray-black",
    overlay: "from-white via-white/25 to-transparent",
  },
  {
    title: "KNOU CS",
    description: "전공 스터디와 기출 CBT로 컴퓨터과학의 단단한 기초를 함께 쌓습니다.",
    href: "/knou-cs",
    image: "/images/hero-bg.jpg",
    imageAlt: "함께 학습하고 이야기하는 Growth Log 구성원",
    width: "w-[86vw] sm:w-[520px] lg:w-[620px]",
    tone: "text-white",
    overlay: "from-black/85 via-black/15 to-transparent",
  },
  {
    title: "Project",
    description: "배운 것을 월간 프로젝트와 수익화 실험으로 연결해 실제 결과를 만듭니다.",
    href: "/projects",
    image: "/images/about/values/real-growth-v2.png",
    imageAlt: "배움이 기록과 결과물, 커리어로 성장하는 3D 오브젝트",
    width: "w-[80vw] sm:w-[460px] lg:w-[540px]",
    tone: "text-gray-black",
    overlay: "from-white via-white/30 to-transparent",
  },
  {
    title: "Club",
    description: "성장일지와 오프라인 네트워킹으로 서로의 과정과 다음 도전을 연결합니다.",
    href: "/activity",
    image: "/images/about/values/together-v2.png",
    imageAlt: "서로 다른 구성원이 하나의 중심에서 연결되는 3D 오브젝트",
    width: "w-[84vw] sm:w-[500px] lg:w-[580px]",
    tone: "text-gray-black",
    overlay: "from-white via-white/30 to-transparent",
  },
] as const;

export function GrowthTracksRail() {
  return (
    <div className="growth-track-rail -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:gap-6 lg:px-8">
      {TRACKS.map((track) => (
        <Link
          key={track.title}
          href={track.href}
          className={[
            "group relative h-[62svh] min-h-[520px] max-h-[720px] shrink-0 snap-center overflow-hidden rounded-[2rem] bg-gray-6",
            track.width,
            track.tone,
          ].join(" ")}
        >
          <Image
            src={track.image}
            alt={track.imageAlt}
            fill
            sizes="(max-width: 640px) 86vw, 620px"
            className="object-cover transition-transform duration-300 ease-[cubic-bezier(.215,.61,.355,1)] group-hover:scale-[1.08] group-focus-visible:scale-[1.08] motion-reduce:transition-none"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-t ${track.overlay}`}
            aria-hidden="true"
          />

          <ArrowUpRight
            className="absolute right-7 top-7 h-6 w-6 transition-transform duration-300 ease-[cubic-bezier(.215,.61,.355,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
            <h3 className="font-montserrat text-[1.625rem] font-semibold leading-[1.2] tracking-[-0.025em] transition-transform duration-300 ease-[cubic-bezier(.215,.61,.355,1)] group-hover:-translate-y-1 md:text-[1.875rem]">
              {track.title}
            </h3>
            <p className="mt-5 max-w-md translate-y-1.5 text-[15px] font-light leading-[1.5] tracking-[-0.045em] opacity-70 transition-all duration-300 ease-[cubic-bezier(.215,.61,.355,1)] group-hover:translate-y-0 group-hover:opacity-95 md:text-base">
              {track.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
