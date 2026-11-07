"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttendeeSummary } from "@/app/api/hackathon/vote/contracts";
import type { AttendeesState } from "./useVoteData";
import { filterAttendees } from "./voteView";

interface MemberPickerProps {
  state: AttendeesState;
  onReload: () => void;
  onSelect: (attendee: AttendeeSummary) => void;
}

function AttendeeRow({
  attendee,
  onSelect,
}: {
  attendee: AttendeeSummary;
  onSelect: (attendee: AttendeeSummary) => void;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={attendee.hasVoted}
        onClick={() => onSelect(attendee)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-5 bg-white px-4 py-3.5 text-left transition-[transform,border-color,background-color] duration-150 hover:border-green-1/50 hover:bg-green-9/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-green-1/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-6 disabled:hover:border-gray-5"
      >
        <span className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-black">{attendee.name}</span>
          <span className="text-xs text-gray-2">{attendee.generation}기</span>
        </span>
        {attendee.hasVoted ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-2">
            <Check className="size-3.5" aria-hidden="true" />
            투표 완료
          </span>
        ) : (
          <ChevronRight className="size-5 text-gray-3" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}

function AttendeeListBody({
  state,
  visible,
  onSelect,
}: {
  state: AttendeesState;
  visible: AttendeeSummary[];
  onSelect: (attendee: AttendeeSummary) => void;
}) {
  if (state.isLoading && state.attendees.length === 0) {
    return (
      <div className="flex flex-col gap-2" aria-label="출석 명단 불러오는 중">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-[54px] rounded-2xl" />
        ))}
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <p className="rounded-2xl bg-gray-6 px-4 py-6 text-center text-sm text-gray-1">
        {state.attendees.length === 0 ? "아직 출석한 회원이 없어요." : "검색 결과가 없어요."}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {visible.map((attendee) => (
        <AttendeeRow key={attendee.memberId} attendee={attendee} onSelect={onSelect} />
      ))}
    </ul>
  );
}

/**
 * 1단계: 출석 명단에서 본인 이름을 검색·선택합니다. 이미 투표한 회원은 선택할 수 없습니다.
 *
 * @param {MemberPickerProps} props - 명단 상태, 새로고침, 선택 콜백
 * @returns {JSX.Element} 이름 선택 화면
 */
export function MemberPicker({ state, onReload, onSelect }: MemberPickerProps) {
  const inputId = useId();
  const [keyword, setKeyword] = useState("");
  const visible = useMemo(
    () => filterAttendees(state.attendees, keyword),
    [state.attendees, keyword]
  );

  return (
    <section aria-labelledby={`${inputId}-title`} className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <h2 id={`${inputId}-title`} className="text-lg font-bold text-gray-black">
          본인 이름 선택
        </h2>
        <Button variant="ghost" size="sm" onClick={onReload} disabled={state.isLoading}>
          {state.isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          명단 새로고침
        </Button>
      </div>

      <label htmlFor={inputId} className="sr-only">
        이름 검색
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-2" aria-hidden="true" />
        <Input
          id={inputId}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="이름을 검색하세요"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="h-12 rounded-2xl pl-10 text-base"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <AttendeeListBody state={state} visible={visible} onSelect={onSelect} />

      <p className="text-center text-[13px] leading-relaxed text-gray-2">
        목록에 이름이 없다면 먼저 회원 페이지에서 QR 출석 체크를 해 주세요.
      </p>
    </section>
  );
}
