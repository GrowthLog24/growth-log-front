"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HACKATHON_TRACK_KEYS, HACKATHON_TRACKS } from "@/domain/hackathon/constants";
import type { HackathonTrack } from "@/domain/hackathon/types";
import { cn } from "@/lib/utils";

interface TrackPickerProps {
  value: HackathonTrack | "";
  error?: string;
  onChange: (track: HackathonTrack) => void;
}

function isTrack(value: string): value is HackathonTrack {
  return (HACKATHON_TRACK_KEYS as readonly string[]).includes(value);
}

/**
 * A~D 트랙 라디오 카드.
 */
export function TrackPicker({ value, error, onChange }: TrackPickerProps) {
  const errorId = error ? "submit-track-error" : undefined;

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold text-gray-black">
        트랙<span className="text-green-1" aria-hidden>*</span>
      </legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => isTrack(next) && onChange(next)}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        aria-invalid={error != null}
        aria-describedby={errorId}
      >
        {HACKATHON_TRACK_KEYS.map((key) => {
          const track = HACKATHON_TRACKS[key];
          const isSelected = value === key;
          return (
            <label
              key={key}
              htmlFor={`submit-track-${key}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors",
                "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-green-1/40",
                isSelected ? "border-green-1 bg-green-9/25" : "border-gray-5 bg-white hover:border-green-8"
              )}
            >
              <RadioGroupItem id={`submit-track-${key}`} value={key} className="mt-0.5" />
              <span className="min-w-0">
                <span className={cn("block text-sm font-bold", isSelected && "text-green-1")}>
                  {key} · {track.name}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-1">
                  {track.description}
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
