"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/domain/entities";
import type { SerializedFirestoreData } from "@/shared/utils/serialize";

interface TimetableClientProps {
  events: SerializedFirestoreData<Event>[];
  currentGeneration: number;
}

function isNow(eventDate: string, startTime: string, endTime: string): boolean {
  const now = new Date();
  const today =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

  if (today !== eventDate) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  return currentMinutes >= startH * 60 + startM && currentMinutes < endH * 60 + endM;
}

export function TimetableClient({ events, currentGeneration }: TimetableClientProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-brand text-white py-16 md:py-20 px-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            {currentGeneration}기 정기모임에
            <br />
            오신 것을 환영합니다!
          </h1>
          <p className="text-[15px] text-white/85 leading-relaxed">
            함께 성장하고, 서로의 목표를 나누는 소중한 시간이 될 거예요.
          </p>
        </div>
      </section>

      {/* 타임테이블 */}
      <section className="max-w-2xl mx-auto px-4 -mt-8 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-1 shrink-0" />
            <h2 className="text-lg font-bold">행사 타임테이블</h2>
          </div>

          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              등록된 행사가 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * 각 행사를 타임블록 카드로 표시
 */
function EventCard({ event }: { event: SerializedFirestoreData<Event> }) {
  const eventIsNow = isNow(event.date, event.startTime, event.endTime);

  const sortedBlocks = [...(event.timeBlocks || [])].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${
        eventIsNow
          ? "border-green-1 border-2 shadow-[0_2px_12px_rgba(0,150,43,0.15)]"
          : "border-gray-5"
      }`}
    >
      {/* 헤더: 행사 시간 + 이름 */}
      <div className="flex items-center gap-3 px-4 py-4">
        <Badge
          className={`shrink-0 font-mono text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-1 text-white hover:bg-green-1 ${
            eventIsNow ? "animate-pulse" : ""
          }`}
        >
          {event.startTime} - {event.endTime}
        </Badge>
        <span className="text-base font-bold text-gray-black">{event.name}</span>
        {eventIsNow && (
          <Badge className="ml-auto shrink-0 bg-green-1 text-white text-xs animate-pulse hover:bg-green-1">
            진행 중
          </Badge>
        )}
      </div>

      {/* 서브 아이템 (타임블록) */}
      {sortedBlocks.length > 0 && (
        <div className="border-t border-gray-5 py-1">
          {sortedBlocks.map((block, i) => {
            const blockIsNow = isNow(event.date, block.startTime, block.endTime);

            return (
              <div
                key={block.id}
                className={`flex items-start gap-3 px-4 py-3 ${
                  i > 0 ? "border-t border-dashed border-gray-5" : ""
                } ${blockIsNow ? "bg-green-9/30 mx-2 px-3 rounded-lg" : ""}`}
              >
                <span
                  className={`text-[13px] font-semibold whitespace-nowrap min-w-[96px] shrink-0 pt-px text-green-1 ${
                    blockIsNow ? "font-bold" : ""
                  }`}
                >
                  {block.startTime} - {block.endTime}
                </span>
                <div className="text-sm text-gray-1 leading-relaxed">
                  <strong className="text-gray-black font-semibold">
                    {block.title}
                  </strong>
                  {block.description && (
                    <span className="block text-xs text-gray-2 mt-1 leading-snug">
                      {block.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
