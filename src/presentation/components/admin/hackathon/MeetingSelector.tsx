"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Meeting } from "@/domain/entities";
import { saveConfigPatch } from "./saveConfigPatch";

/** 선택 목록에 보여줄 최근 회차 수 */
const MEETING_OPTION_LIMIT = 30;

interface MeetingSelectorProps {
  hackathonId: string;
  meetingId: string | null;
  meetings: readonly Meeting[];
  checkinMeetingId: string | null;
}

/**
 * 투표 자격(QR 출석) 판정에 쓰는 정기모임 회차 선택.
 * 설정에 회차가 없으면 현재 QR 체크인이 열린 회차를 제안합니다.
 */
export function MeetingSelector({
  hackathonId,
  meetingId,
  meetings,
  checkinMeetingId,
}: MeetingSelectorProps) {
  const [saving, setSaving] = useState(false);
  const suggested = meetingId === null ? checkinMeetingId : null;
  const current = meetings.find((m) => m.id === meetingId);
  const suggestedMeeting = meetings.find((m) => m.id === suggested);
  const options = buildOptions(meetings, meetingId);

  const apply = async (id: string, title: string) => {
    setSaving(true);
    await saveConfigPatch(hackathonId, { meetingId: id }, `출석 회차를 '${title}'(으)로 지정했습니다.`);
    setSaving(false);
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Label className="text-sm font-semibold">투표 자격 회차 (QR 출석 체크 대상)</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={meetingId ?? ""}
          disabled={saving}
          onValueChange={(id) => {
            const meeting = meetings.find((m) => m.id === id);
            if (meeting) void apply(meeting.id, meeting.title);
          }}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="회차를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {options.map((meeting) => (
              <SelectItem key={meeting.id} value={meeting.id}>
                {meeting.title}
                {meeting.id === checkinMeetingId ? " · QR 체크인 열림" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {current ? (
          <Badge variant="outline">현재: {current.title}</Badge>
        ) : meetingId ? (
          <Badge variant="destructive">목록에 없는 회차 ID: {meetingId}</Badge>
        ) : (
          <Badge variant="destructive">미지정 — 투표 자격 판정 불가</Badge>
        )}
      </div>
      {suggestedMeeting && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
          <span>QR 체크인이 열린 회차: <strong>{suggestedMeeting.title}</strong></span>
          <Button
            size="sm"
            disabled={saving}
            onClick={() => void apply(suggestedMeeting.id, suggestedMeeting.title)}
          >
            이 회차로 지정
          </Button>
        </div>
      )}
    </div>
  );
}

function buildOptions(meetings: readonly Meeting[], selectedId: string | null): Meeting[] {
  const recent = meetings.slice(0, MEETING_OPTION_LIMIT);
  const selected = meetings.find((m) => m.id === selectedId);
  if (selected && !recent.includes(selected)) return [selected, ...recent];
  return recent;
}
