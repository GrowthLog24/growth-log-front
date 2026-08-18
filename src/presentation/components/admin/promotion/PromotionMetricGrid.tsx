import { AlertTriangle, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PromotionBoard } from "@/domain/entities";

/** 방송대 홍보 게시 운영 현황 요약 카드 */
export function PromotionMetricGrid({ boards }: { boards: PromotionBoard[] }) {
  const readyCount = boards.filter((board) => board.status === "준비됨").length;
  const unavailableCount = boards.filter((board) => board.status === "게시판 없음").length;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="운영 현황">
      <Card className="border-t-2 border-t-primary py-5">
        <CardContent className="px-5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>운영 대상</span>
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="size-4" />
            </span>
          </div>
          <strong className="mt-3 block text-2xl font-semibold tracking-tight">{boards.length}</strong>
          <p className="mt-2 text-xs text-muted-foreground">게시 가능 {readyCount} · 예외 {unavailableCount}</p>
        </CardContent>
      </Card>
      <Card className="py-5">
        <CardContent className="px-5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>확인 필요</span>
            <span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <strong className="mt-3 block text-2xl font-semibold tracking-tight">{unavailableCount}</strong>
          <p className="mt-2 text-xs text-muted-foreground">전용 게시판이 없는 대상</p>
        </CardContent>
      </Card>
    </section>
  );
}
