import type { Member, WeeklyValue } from "./types";

interface MemberTableProps {
  members: Member[];
  totalWeeks: number;
}

const CELL_BASE =
  "inline-flex items-center justify-center w-9 h-8 rounded-lg font-mono font-bold text-[13px]";

function WeekCell({ value }: { value: WeeklyValue }) {
  if (value === "NA") {
    return (
      <span className={`${CELL_BASE} text-gray-3 text-[11px] opacity-50`}>
        —
      </span>
    );
  }
  if (value === 0) {
    return <span className={`${CELL_BASE} text-gray-2 opacity-50`}>0</span>;
  }
  if (value >= 3) {
    return <span className={`${CELL_BASE} bg-green-1/10 text-green-1`}>{value}</span>;
  }
  return <span className={`${CELL_BASE} bg-gray-6 text-gray-1`}>{value}</span>;
}

export function MemberTable({ members, totalWeeks }: MemberTableProps) {
  const weekHeaders = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  // 꾸준함(매주 3회 성공)이 핵심 지표 → 성공 주차 내림차순, 동률이면 총 인증 내림차순
  const sortedMembers = [...members].sort(
    (a, b) => b.success - a.success || b.total - a.total
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="sticky top-0 border-b-2 border-foreground bg-gray-7 px-5 py-3.5 text-left text-xs font-bold text-foreground">
                멤버
              </th>
              {weekHeaders.map((w) => (
                <th
                  key={w}
                  className="sticky top-0 min-w-[52px] border-b-2 border-foreground bg-gray-7 px-2 py-3.5 text-center font-mono text-[11px] font-bold text-gray-2"
                >
                  W{w}
                </th>
              ))}
              <th className="sticky top-0 border-b-2 border-foreground bg-foreground px-2 py-3.5 text-center text-xs font-bold text-white">
                TOTAL
              </th>
              <th className="sticky top-0 border-b-2 border-foreground bg-green-1/10 px-2 py-3.5 text-center text-xs font-bold text-green-1">
                성공/{totalWeeks}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((m) => {
              const isOver = m.total >= 30;
              const successPct = Math.round((m.success / totalWeeks) * 100);
              return (
                <tr
                  key={m.name}
                  className="border-b border-border last:border-b-0 hover:bg-gray-7"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-left text-sm font-bold text-foreground">
                    {m.name}
                    {m.joinWeek && (
                      <span className="ml-1 text-[10px] font-medium text-gray-2">
                        (W{m.joinWeek}~)
                      </span>
                    )}
                  </td>
                  {m.weekly.map((v, i) => (
                    <td key={i} className="px-2 py-3 text-center align-middle">
                      <WeekCell value={v} />
                    </td>
                  ))}
                  <td
                    className={`px-2 py-3 text-center align-middle font-mono text-base font-extrabold ${
                      isOver
                        ? "bg-green-1/10 text-green-1"
                        : "bg-gray-7 text-foreground"
                    }`}
                  >
                    {m.total}
                  </td>
                  <td className="bg-green-1/10 px-2 py-3 text-center align-middle font-mono font-bold text-green-1">
                    <span className="text-[13px]">
                      {m.success} / {totalWeeks}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-gray-2">
                      {successPct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
