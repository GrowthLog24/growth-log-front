"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const VALUES = [
  {
    title: "Together",
    tagline: "서로의 가능성을 연결합니다.",
    description:
      "혼자 빠르게 가는 것보다 함께 멀리 가는 방식을 믿습니다. 서로의 과정을 기록하고, 질문하고, 다음 도전을 응원합니다.",
    objectSrc: "/images/about/values/together-v2.png",
    objectAlt: "서로 다른 세 모듈이 하나의 중심에서 연결되는 3D 오브젝트",
    parallaxStrength: 82,
  },
  {
    title: "AI-Native",
    tagline: "AI를 가장 자연스러운 동료로.",
    description:
      "AI를 단순한 자동화 도구가 아닌 사고를 확장하는 페어로 활용합니다. 더 빠르게 실험하고 더 깊게 배우는 방식을 익힙니다.",
    objectSrc: "/images/about/values/ai-native-v2.png",
    objectAlt: "유기적 사고와 정밀한 AI 연산이 녹색 코어로 연결되는 3D 오브젝트",
    parallaxStrength: -104,
  },
  {
    title: "Real Growth",
    tagline: "배움을 실제 결과로 바꿉니다.",
    description:
      "인증을 위한 활동에 머물지 않습니다. 기록은 포트폴리오로, 프로젝트는 사용자와 매출로, 경험은 다음 커리어로 이어집니다.",
    objectSrc: "/images/about/values/real-growth-v2.png",
    objectAlt: "배움이 기록과 결과물, 커리어로 발전하는 성장 단계를 표현한 3D 오브젝트",
    parallaxStrength: 118,
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
    <div className="relative w-full">
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
              className="flex items-center py-7 md:py-9"
            >
              <div
                className={[
                  "grid w-full items-center gap-5 transition-all duration-700 ease-out motion-reduce:transition-none md:grid-cols-6 md:gap-6 lg:gap-8",
                  isActive
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-30",
                ].join(" ")}
              >
                <div
                  className={[
                    "relative mx-auto h-[160px] w-full max-w-[180px] md:col-span-2 md:h-[200px] md:max-w-[220px] lg:h-[220px]",
                    index === 0
                      ? "md:col-start-1"
                      : index === 1
                        ? "md:col-start-5"
                        : "md:col-start-1",
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
                          ? "md:-translate-x-3"
                          : index === 1
                            ? "md:translate-x-5 md:scale-95"
                            : "md:-translate-x-2 md:scale-105",
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

                <div
                  className={[
                    "md:col-span-2",
                    index === 0
                      ? "md:col-start-3"
                      : index === 1
                        ? "md:col-start-3 md:row-start-1"
                        : "md:col-start-3",
                  ].join(" ")}
                >
                  <h3 className="font-montserrat text-xl font-semibold leading-[1.5] tracking-normal text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-5 max-w-lg text-sm font-medium leading-[1.5] tracking-normal text-foreground">
                    {value.tagline}
                  </p>
                  <p className="mt-4 max-w-xl text-sm font-normal leading-[1.5] tracking-normal text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
