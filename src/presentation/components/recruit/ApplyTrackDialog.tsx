"use client";

import { useState } from "react";
import { ArrowUpRight, Code2, ExternalLink, GraduationCap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trackEvent } from "@/shared/utils/analytics";
import type { ApplyTrackId } from "@/shared/constants/recruit";

/** 지원 경로 표시 정보 (링크는 어드민 설정에서 주입) */
interface ApplyTrack {
  id: ApplyTrackId;
  label: string;
  description: string;
  icon: LucideIcon;
}

const APPLY_TRACKS: readonly ApplyTrack[] = [
  {
    id: "cs",
    label: "방송대 컴퓨터과학과",
    description: "컴퓨터과학과 학우용 지원서",
    icon: Code2,
  },
  {
    id: "other",
    label: "방송대 그 외 학과",
    description: "컴퓨터과학과가 아닌 학우용 지원서",
    icon: GraduationCap,
  },
];

interface ApplyTrackRowProps {
  track: ApplyTrack;
  href: string;
  onSelect: () => void;
}

/**
 * 지원 경로 한 줄. 링크가 등록되지 않았으면 비활성 상태로 표시합니다.
 */
function ApplyTrackRow({ track, href, onSelect }: ApplyTrackRowProps) {
  const Icon = track.icon;

  // 어드민에서 링크를 등록하지 않은 경우: 깨진 링크 대신 준비 중임을 명시
  if (!href) {
    return (
      <div
        aria-disabled="true"
        className="flex items-center gap-4 rounded-xl border border-dashed border-gray-4 bg-gray-6/60 p-4"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gray-5 text-gray-1">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold break-keep text-gray-1">{track.label}</span>
          <span className="mt-0.5 block text-sm break-keep text-gray-1">
            지원서 링크가 아직 등록되지 않았습니다.
          </span>
        </span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onSelect}
      className="group flex items-center gap-4 rounded-xl border border-gray-5 bg-white p-4 transition duration-150 ease-out hover:-translate-y-px hover:border-primary hover:shadow-[0_10px_28px_-14px_rgba(0,150,43,0.45)] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 active:scale-[0.985] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gray-6 text-gray-1 transition-colors duration-150 ease-out group-hover:bg-primary group-hover:text-white motion-reduce:transition-none">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold break-keep text-foreground">{track.label}</span>
        <span className="mt-0.5 block text-sm break-keep text-muted-foreground">
          {track.description}
        </span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-gray-3 transition duration-150 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0" />
    </a>
  );
}

interface ApplyTrackDialogProps {
  /** 모집 기수 */
  generation: number;
  /** 방송대 컴퓨터과학과 지원서 링크 */
  csFormLink: string;
  /** 방송대 그 외 학과 지원서 링크 */
  otherFormLink: string;
  /** 모달을 여는 버튼 텍스트 */
  triggerLabel: string;
  /** 모달을 여는 버튼의 추가 클래스 (배경에 따른 색상 조정) */
  triggerClassName?: string;
  /** GA 이벤트용 CTA 위치 (예: recruit_hero, recruit_bottom) */
  ctaLocation: string;
}

/**
 * 지원하기 버튼을 눌렀을 때 소속 학과에 따라 지원서를 선택하는 모달.
 *
 * 구글폼으로 곧바로 이동하지 않고, 방송대 컴퓨터과학과 / 그 외 학과 두 갈래로 안내합니다.
 */
export function ApplyTrackDialog({
  generation,
  csFormLink,
  otherFormLink,
  triggerLabel,
  triggerClassName,
  ctaLocation,
}: ApplyTrackDialogProps) {
  const [open, setOpen] = useState(false);

  const formLinks: Record<ApplyTrackId, string> = {
    cs: csFormLink,
    other: otherFormLink,
  };

  // 모달이 열리는 순간이 곧 지원 CTA 클릭이므로 기존 cta_click 이벤트를 여기서 발생시킨다.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      trackEvent("cta_click", {
        cta_type: "membership_application",
        cta_location: ctaLocation,
        generation,
      });
    }
  };

  // 어느 지원서를 골랐는지 기록 (학과별 유입 비율 파악용)
  const handleSelect = (trackId: ApplyTrackId) => {
    trackEvent("select_content", {
      content_type: "application_form",
      item_id: trackId,
      cta_location: ctaLocation,
      generation,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className={triggerClassName}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-xs font-semibold tracking-[0.08em] text-gray-1 uppercase">
            Growth Log {generation}기
          </p>
          <DialogTitle className="text-xl leading-tight font-bold tracking-tight">
            어떤 지원서를 작성하시나요?
          </DialogTitle>
          <DialogDescription>
            소속 학과에 따라 지원서가 나뉩니다. 해당하는 쪽을 선택해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {APPLY_TRACKS.map((track) => (
            <ApplyTrackRow
              key={track.id}
              track={track}
              href={formLinks[track.id]}
              onSelect={() => handleSelect(track.id)}
            />
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ExternalLink className="size-3.5 shrink-0" />
          선택하시면 구글 폼이 새 창에서 열립니다.
        </p>
      </DialogContent>
    </Dialog>
  );
}
