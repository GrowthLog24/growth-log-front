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
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
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
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                className="text-3xl md:text-4xl font-bold text-foreground"
                suffixClassName="text-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
