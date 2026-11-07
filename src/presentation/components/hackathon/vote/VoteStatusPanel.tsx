import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "danger";

interface VoteStatusPanelProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  tone?: Tone;
  /** 상태가 실시간으로 바뀌는 안내라면 true (스크린리더에 변경 알림) */
  isLive?: boolean;
  children?: ReactNode;
}

const ICON_TONE: Record<Tone, string> = {
  neutral: "bg-gray-6 text-gray-1",
  brand: "bg-green-9/40 text-green-1",
  danger: "bg-red-50 text-red-600",
};

/**
 * 투표 화면의 대기·준비 중·완료·오류 상태를 보여주는 안내 패널입니다.
 *
 * @param {VoteStatusPanelProps} props - 아이콘, 제목, 설명, 하단 동작
 * @returns {JSX.Element} 상태 안내 패널
 */
export function VoteStatusPanel({
  icon,
  title,
  description,
  tone = "neutral",
  isLive = false,
  children,
}: VoteStatusPanelProps) {
  return (
    <section
      className="flex flex-col items-center gap-4 rounded-3xl border border-gray-5 bg-white px-6 py-12 text-center shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(0,150,43,0.25)]"
      aria-live={isLive ? "polite" : undefined}
    >
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-full [&_svg]:size-8",
          ICON_TONE[tone]
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h2 className="text-xl font-bold text-gray-black">{title}</h2>
      {description && (
        <p className="max-w-xs text-[15px] leading-relaxed text-gray-1">{description}</p>
      )}
      {children}
    </section>
  );
}
