import type { ChallengeData } from "./types";
import { MemberTable } from "./MemberTable";

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between border-b border-border pb-3">
      <h2 className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-foreground md:text-[22px]">
        <span className="inline-block h-5 w-1 rounded-sm bg-green-1" />
        {title}
      </h2>
      <span className="font-mono text-[13px] text-gray-2">{desc}</span>
    </div>
  );
}

export function ChallengeDashboard({
  meta,
  kpis,
  weekStats,
  members,
  honors,
  footer,
}: ChallengeData) {
  return (
    <section className="py-12 md:py-16">
      <div className="container-custom">
        {/* Header */}
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-7">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-green-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-1" />
              {meta.eyebrow}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-[44px]">
              {meta.title}
              <br />
              <span className="text-green-1">{meta.titleAccent}</span>
            </h1>
          </div>
          <div className="text-right font-mono text-xs text-gray-2">
            <div>REPORT</div>
            <div className="text-[13px] font-bold text-foreground">{meta.meta}</div>
          </div>
        </header>

        {/* KPI */}
        <section className="mb-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`group rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                kpi.featured
                  ? "border-foreground bg-foreground"
                  : "border-border bg-gray-7 hover:border-green-1"
              }`}
            >
              <div
                className={`mb-3 font-mono text-xs font-semibold uppercase tracking-[0.06em] ${
                  kpi.featured ? "text-white/60" : "text-gray-2"
                }`}
              >
                {kpi.label}
              </div>
              <div
                className={`flex items-baseline gap-1.5 text-3xl font-extrabold leading-none tracking-tight md:text-[44px] ${
                  kpi.featured ? "text-green-5" : "text-foreground"
                }`}
              >
                {kpi.value}
                <span
                  className={`text-base font-semibold ${
                    kpi.featured ? "text-white/60" : "text-gray-2"
                  }`}
                >
                  {kpi.unit}
                </span>
              </div>
              <div
                className={`mt-2 text-[13px] ${
                  kpi.featured ? "text-white/70" : "text-gray-1"
                }`}
              >
                {kpi.sub}
              </div>
            </div>
          ))}
        </section>

        {/* Weekly Breakdown */}
        <section className="mb-14">
          <SectionHeader title="주차별 결산" desc="success ≥ 3 · fail < 3" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {weekStats.map((w) => {
              const people = w.success + w.fail;
              const succPct = people > 0 ? (w.success / people) * 100 : 0;
              const failPct = people > 0 ? (w.fail / people) * 100 : 0;
              return (
                <div
                  key={w.week}
                  className="rounded-xl border border-border bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground hover:shadow-md"
                >
                  <div className="font-mono text-[11px] font-bold tracking-[0.06em] text-gray-2">
                    WEEK {String(w.week).padStart(2, "0")}
                  </div>
                  <div className="mb-1 mt-2 text-[32px] font-extrabold tracking-tight text-foreground">
                    {w.total}
                    <span className="text-sm font-semibold text-gray-2">회</span>
                  </div>
                  <div className="mb-3.5 text-[11px] text-gray-2">총 인증</div>
                  <div className="mb-2.5 flex h-1.5 overflow-hidden rounded-full bg-gray-6">
                    <div className="h-full bg-green-1" style={{ width: `${succPct}%` }} />
                    <div
                      className="h-full bg-foreground/15"
                      style={{ width: `${failPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[11px] font-semibold">
                    <span className="text-green-1">✓ {w.success}</span>
                    <span className="text-gray-2">✗ {w.fail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Member Table */}
        <section className="mb-14">
          <SectionHeader title="멤버별 인증 기록" desc="total · success rate" />
          <MemberTable members={members} totalWeeks={meta.totalWeeks} />
          <div className="mt-4 flex flex-wrap gap-5 font-mono text-xs text-gray-1">
            <div className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-green-1/10" /> 성공 (3회 이상)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-gray-6" /> 실패 (3회 미만)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded border border-dashed border-gray-3" />{" "}
              미참여
            </div>
          </div>
        </section>

        {/* Honor Roll */}
        <section className="mb-14">
          <SectionHeader title="Honor Roll · 명예의 전당" desc="top performers" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {honors.map((h) => (
              <div
                key={h.rank}
                className={`rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  h.gold
                    ? "border-foreground bg-foreground"
                    : "border-border bg-card hover:border-green-1"
                }`}
              >
                <div
                  className={`mb-2 font-mono text-[11px] font-bold tracking-[0.08em] ${
                    h.gold ? "text-green-5" : "text-gray-2"
                  }`}
                >
                  {h.rank}
                </div>
                <div
                  className={`mb-1.5 text-[28px] font-extrabold tracking-tight ${
                    h.gold ? "text-white" : "text-foreground"
                  }`}
                >
                  {h.name}
                </div>
                <div
                  className={`font-mono text-sm font-semibold ${
                    h.gold ? "text-white/80" : "text-gray-1"
                  }`}
                >
                  <span
                    className={`mr-1 text-[22px] font-extrabold ${
                      h.gold ? "text-green-5" : "text-green-1"
                    }`}
                  >
                    {h.big}
                  </span>
                  · {h.detail}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-border pt-6 text-center font-mono text-xs text-gray-2">
          {footer.lead} ·{" "}
          <span className="font-bold text-green-1">{footer.highlight}</span> ·{" "}
          {footer.tail}
        </footer>
      </div>
    </section>
  );
}
