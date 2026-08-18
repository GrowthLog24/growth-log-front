import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type StepState = "done" | "current" | undefined;

function FlowStep({ number, title, detail, state, last = false }: { number: number; title: string; detail: string; state?: StepState; last?: boolean }) {
  const numberClass = state === "done"
    ? "border-emerald-700 bg-emerald-700 text-white"
    : state === "current"
      ? "border-primary bg-white text-primary ring-4 ring-primary/10"
      : "border-border bg-white text-muted-foreground";

  return (
    <li className="relative flex min-h-14 gap-3">
      {!last && <i className="absolute top-7 bottom-0 left-3 hidden w-px bg-border xl:block" />}
      <span className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${numberClass}`}>{number}</span>
      <div>
        <strong className="block text-xs font-semibold">{title}</strong>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

/** 운영진 로그인부터 게시 결과 확인까지의 방송대 홍보 게시 흐름 */
export function LoginFlow() {
  return (
    <Card className="py-5 sm:py-6">
      <CardContent className="px-5 sm:px-6">
        <div className="flex items-center justify-between gap-5 border-b pb-4">
          <div>
            <span className="text-[10px] font-semibold tracking-wide text-amber-700 uppercase">안전한 연결</span>
            <h2 className="mt-1 text-base font-semibold">로그인 흐름</h2>
          </div>
          <span className="grid size-8 place-items-center rounded-full bg-amber-50 text-amber-700" aria-hidden="true">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
        <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:gap-0">
          <FlowStep number={1} title="운영진 로그인" detail="내부 운영 계정으로 접근" state="done" />
          <FlowStep number={2} title="방송대 공식 로그인" detail="전용 Chrome에서 로그인 처리" state="current" />
          <FlowStep number={3} title="게시 검토 및 승인" detail="대상과 내용을 마지막으로 확인" />
          <FlowStep number={4} title="게시 결과 확인" detail="링크와 상태를 자동 기록" last />
        </ol>
      </CardContent>
    </Card>
  );
}
