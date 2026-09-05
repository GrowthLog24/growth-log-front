"use client";

import { useState } from "react";
import { MapPin, Check, Loader2, AlertCircle } from "lucide-react";
import { isInGangnam } from "@/domain/checkin/geo";
import { attendanceAdminRepository } from "@/infrastructure/repositories/admin";
import { checkinConfigRepository } from "@/infrastructure/repositories";

/**
 * QR 체크인 배너 Props
 */
interface MemberCheckInProps {
  /** 현재 체크인 대상 회차 문서 ID */
  meetingId: string;
  /** 회차 제목 (표시용) */
  meetingTitle: string;
  /** 회차 기수 (출결 비정규화 필드) */
  meetingGeneration: number;
  /** 회차 번호 (출결 비정규화 필드) */
  meetingRound: number;
  /** 회원 문서 ID */
  memberId: string;
  /** 회원 이름 (표시용) */
  memberName: string;
}

/**
 * 체크인 배너의 화면 상태
 */
type UiState =
  | { kind: "idle" }
  | { kind: "working"; message: string }
  | { kind: "done"; time: string }
  | { kind: "error"; reason: string };

/** 위치 조회 옵션: 고정밀·10초 제한·캐시 미사용 */
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * 현재 시각을 "오후 2:32" 형식으로 반환합니다.
 */
function formatNow(): string {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * 라운지 QR 출석 체크 배너.
 *
 * 명찰 QR로 업적 페이지에 진입한 회원이 [출석하기]를 누르면
 * 기기 위치를 확인해 강남구(라운지) 안일 때만 해당 회차 출결을
 * "present"로 기록합니다. 실패 시 담당자에게 문의하도록 안내합니다.
 */
export function MemberCheckIn({
  meetingId,
  meetingTitle,
  meetingGeneration,
  meetingRound,
  memberId,
  memberName,
}: MemberCheckInProps) {
  const [state, setState] = useState<UiState>({ kind: "idle" });

  const submit = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({
        kind: "error",
        reason: "이 기기에서는 위치를 확인할 수 없어요",
      });
      return;
    }

    setState({ kind: "working", message: "위치 확인 중…" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (!isInGangnam(latitude, longitude)) {
          setState({
            kind: "error",
            reason: "현재 위치가 라운지(강남구)가 아니에요",
          });
          return;
        }

        try {
          setState({ kind: "working", message: "출석 기록 중…" });
          // 제출 시점에 체크인이 여전히 이 회차로 열려 있는지 재확인합니다.
          // (운영자가 그새 체크인을 닫았거나 다른 회차로 바꿨을 수 있음)
          const current = await checkinConfigRepository.getCurrent();
          if (!current || !current.open || current.meetingId !== meetingId) {
            setState({ kind: "error", reason: "체크인이 마감되었어요" });
            return;
          }
          await attendanceAdminRepository.saveMany(
            {
              id: meetingId,
              generation: meetingGeneration,
              round: meetingRound,
            },
            [{ memberId, status: "present" }]
          );
          setState({ kind: "done", time: formatNow() });
        } catch (error) {
          console.error("Check-in write failed:", error);
          setState({ kind: "error", reason: "출석 기록 중 오류가 났어요" });
        }
      },
      (error) => {
        const reason =
          error.code === error.PERMISSION_DENIED
            ? "위치 권한을 허용해야 출석할 수 있어요"
            : "위치를 확인하지 못했어요";
        setState({ kind: "error", reason });
      },
      GEO_OPTIONS
    );
  };

  return (
    <section
      aria-label="출석 체크"
      className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm"
    >
      <p className="text-sm font-medium text-muted-foreground">{meetingTitle}</p>

      {state.kind === "idle" && (
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-foreground">
              {memberName}님, 출석 체크
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              라운지에서 눌러주세요 (위치 확인)
            </p>
          </div>
          <button
            type="button"
            onClick={submit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            <MapPin className="h-5 w-5" />
            출석하기
          </button>
        </div>
      )}

      {state.kind === "working" && (
        <div className="mt-2 flex items-center gap-2 text-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-medium">{state.message}</span>
        </div>
      )}

      {state.kind === "done" && (
        <div className="mt-2 flex items-center gap-2 text-primary">
          <Check className="h-6 w-6" />
          <span className="text-lg font-bold">출석 완료 · {state.time}</span>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-2">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-medium">
              {state.reason}.
              <br />
              출석 확인에 실패했어요. 김태홍한테 문의주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={submit}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            다시 시도
          </button>
        </div>
      )}
    </section>
  );
}
