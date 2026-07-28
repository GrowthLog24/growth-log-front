"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Handshake, TrendingUp, Zap } from "lucide-react";

const VALUES = [
  {
    number: "01",
    icon: Handshake,
    title: "Together",
    tagline: "서로의 가능성을 연결합니다.",
    description:
      "혼자 빠르게 가는 것보다 함께 멀리 가는 방식을 믿습니다. 서로의 과정을 기록하고, 질문하고, 다음 도전을 응원합니다.",
    objectSrc: "/images/about/values/together.png",
    objectAlt: "서로 맞물려 하나를 이루는 세 개의 3D 오브젝트",
    parallaxStrength: 56,
  },
  {
    number: "02",
    icon: Zap,
    title: "AI-Native",
    tagline: "AI를 가장 자연스러운 동료로.",
    description:
      "AI를 단순한 자동화 도구가 아닌 사고를 확장하는 페어로 활용합니다. 더 빠르게 실험하고 더 깊게 배우는 방식을 익힙니다.",
    objectSrc: "/images/about/values/ai-native.png",
    objectAlt: "중심에서 여러 방향으로 확장되는 AI 3D 오브젝트",
    parallaxStrength: -72,
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Real Growth",
    tagline: "배움을 실제 결과로 바꿉니다.",
    description:
      "인증을 위한 활동에 머물지 않습니다. 기록은 포트폴리오로, 프로젝트는 사용자와 매출로, 경험은 다음 커리어로 이어집니다.",
    objectSrc: "/images/about/values/real-growth.png",
    objectAlt: "위로 이어지는 성장 경로와 녹색 구체 3D 오브젝트",
    parallaxStrength: 84,
  },
] as const;

export function InteractiveValues() {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const objectRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const index = Number((visibleEntry.target as HTMLElement).dataset.valueIndex);
        setActiveIndex(index);
      },
      {
        rootMargin: "-38% 0px -38% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frameId: number | null = null;

    const updateParallax = () => {
      objectRefs.current.forEach((object, index) => {
        const item = itemRefs.current[index];
        if (!object || !item) return;

        const rect = item.getBoundingClientRect();
        const distanceFromCenter =
          (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        const parallaxLimit = Math.abs(VALUES[index].parallaxStrength);
        const offset = Math.max(
          -parallaxLimit,
          Math.min(
            parallaxLimit,
            distanceFromCenter * VALUES[index].parallaxStrength
          )
        );

        object.style.transform = `translate3d(0, ${offset}px, 0)`;
      });

      frameId = null;
    };

    const requestUpdate = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="sticky top-20 z-20 h-px bg-border" aria-hidden="true">
        <span
          className="block h-px bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${((activeIndex + 1) / VALUES.length) * 100}%` }}
        />
      </div>

      <div>
        {VALUES.map((value, index) => {
          const isActive = activeIndex === index;

          return (
            <article
              key={value.title}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              data-value-index={index}
              className="flex min-h-[58vh] items-center border-b border-border py-14 last:border-b-0 md:min-h-[68vh] md:py-20"
            >
              <div
                className={[
                  "grid w-full items-center gap-6 transition-all duration-700 ease-out motion-reduce:transition-none md:grid-cols-2 md:gap-14 lg:gap-20",
                  isActive
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-25",
                ].join(" ")}
              >
                <div
                  className={[
                    "relative h-[300px] md:h-[430px] lg:h-[500px]",
                    index % 2 === 0 ? "md:order-1" : "md:order-2",
                  ].join(" ")}
                >
                  <div
                    ref={(element) => {
                      objectRefs.current[index] = element;
                    }}
                    className="absolute inset-0 will-change-transform"
                  >
                    <div
                      className={[
                        "absolute inset-0",
                        index === 0
                          ? "md:-translate-x-6"
                          : index === 1
                            ? "md:translate-x-8 md:scale-90"
                            : "md:-translate-x-3 md:scale-105",
                      ].join(" ")}
                    >
                      <Image
                        src={value.objectSrc}
                        alt={value.objectAlt}
                        fill
                        sizes="(max-width: 768px) 90vw, 45vw"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className={index % 2 === 0 ? "md:order-2" : "md:order-1"}>
                  <div className="flex items-center gap-4">
                    <span
                      className={[
                        "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-500",
                        isActive ? "bg-primary text-white" : "bg-primary/10 text-primary",
                      ].join(" ")}
                    >
                      <value.icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold tracking-[0.18em] text-muted-foreground">
                      {value.number}
                    </span>
                  </div>
                  <h3 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                    {value.title}
                  </h3>
                  <p className="mt-5 text-lg font-semibold text-foreground md:text-xl">
                    {value.tagline}
                  </p>
                  <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                    {value.description}
                  </p>
                  <span
                    className={[
                      "mt-10 block h-0.5 max-w-24 origin-left bg-primary transition-transform duration-700 motion-reduce:transition-none",
                      isActive ? "scale-x-100" : "scale-x-0",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
