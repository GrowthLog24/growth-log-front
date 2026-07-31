"use client";

import { AnimatedCounter } from "@/presentation/components/common";

interface StatItem {
  label: string;
  value: number;
  suffix: string;
}

interface StatsSectionProps {
  stats: StatItem[];
}

/**
 * 통계 섹션 - 숫자 카운트업 애니메이션 포함
 */
export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="section-padding bg-[#f5f8f4]">
      <div className="container-custom">
        <div className="about-six-grid mb-8 md:mb-10">
          <div className="md:col-span-3 md:col-start-1">
          <span className="font-montserrat text-xs font-medium text-primary">
            GROWTH LOG DATA
          </span>
          <h2 className="mt-4 text-foreground">
            그로스로그는 지금도 성장 중!
          </h2>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="about-six-grid gap-y-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-start"
            >
              <span className="mb-2 text-sm text-muted-foreground">
                {stat.label}
              </span>
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                className="text-2xl font-semibold text-foreground"
                suffixClassName="text-base"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
