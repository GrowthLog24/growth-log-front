"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useJsApiLoader } from "@react-google-maps/api";
import { Loader2, LocateFixed, MapPin, RotateCcw, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidCheckinArea } from "@/domain/checkin/geo";
import type { CheckinLocation } from "@/domain/entities";
import { checkinConfigRepository } from "@/infrastructure/repositories/checkinConfigRepository";
import { checkinConfigAdminRepository } from "@/infrastructure/repositories/admin/checkinConfigAdminRepository";

/** 선택 가능한 허용 반경(m) */
const RADIUS_OPTIONS = [300, 500, 1000, 2000] as const;
const DEFAULT_RADIUS_METERS = 1000;

/** 대한민국 좌표 대략 범위 — 위도/경도 뒤바뀜 같은 입력 실수 방지용 */
const KOREA_BOUNDS = { latMin: 33, latMax: 39, lngMin: 124, lngMax: 132 } as const;

/** 운영자 위치 조회 옵션 */
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

function formatRadius(meters: number): string {
  return meters >= 1000 ? `${meters / 1000}km` : `${meters}m`;
}

function isInKorea(lat: number, lng: number): boolean {
  return (
    lat >= KOREA_BOUNDS.latMin &&
    lat <= KOREA_BOUNDS.latMax &&
    lng >= KOREA_BOUNDS.lngMin &&
    lng <= KOREA_BOUNDS.lngMax
  );
}

/**
 * QR 체크인 허용 장소 설정 카드.
 *
 * 기본은 강남구 라운지 판정이며, 외부 장소에서 모임을 할 때
 * 주소(→좌표)와 반경을 지정하면 그 장소 반경 안에서만 출석이 허용됩니다.
 */
export function CheckinLocationCard() {
  const [saved, setSaved] = useState<CheckinLocation | null>(null);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS_METERS);
  const [busy, setBusy] = useState(false);

  // 공개 지도 컴포넌트(GoogleMap)와 동일한 로더 옵션을 써야 충돌하지 않습니다.
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    language: "ko",
    region: "KR",
  });

  useEffect(() => {
    checkinConfigRepository
      .getCurrent()
      .then((config) => {
        const location = config?.location ?? null;
        setSaved(location);
        if (location) {
          setAddress(location.address);
          setLat(String(location.lat));
          setLng(String(location.lng));
          setRadius(location.radiusMeters);
        }
      })
      .catch((error) => {
        console.error("Failed to load checkin location:", error);
        toast.error("체크인 위치를 불러오지 못했습니다.");
      });
  }, []);

  const geocodeAddress = () => {
    if (!address.trim()) {
      toast.error("주소를 입력해주세요.");
      return;
    }
    if (!isMapsLoaded) {
      toast.error("지도 API를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setBusy(true);
    new google.maps.Geocoder().geocode({ address }, (results, status) => {
      setBusy(false);
      const location = status === "OK" ? results?.[0]?.geometry.location : null;
      if (!location) {
        console.error("Geocode failed:", status);
        toast.error(
          "주소로 좌표를 찾지 못했어요. 좌표를 직접 입력하거나 '내 위치'를 사용하세요."
        );
        return;
      }
      setLat(location.lat().toFixed(6));
      setLng(location.lng().toFixed(6));
      toast.success("좌표를 찾았어요. 확인 후 저장하세요.");
    });
  };

  const fillMyPosition = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("이 기기에서는 위치를 확인할 수 없어요.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBusy(false);
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        toast.success("현재 위치 좌표를 넣었어요.");
      },
      () => {
        setBusy(false);
        toast.error("현재 위치를 확인하지 못했어요.");
      },
      GEO_OPTIONS
    );
  };

  const persist = async (location: CheckinLocation | null) => {
    setBusy(true);
    try {
      await checkinConfigAdminRepository.setLocation(location);
      setSaved(location);
      toast.success(
        location
          ? `체크인 위치를 저장했어요 — ${location.address} 반경 ${formatRadius(location.radiusMeters)}`
          : "기본(강남구 라운지)으로 되돌렸어요."
      );
    } catch (error) {
      console.error("Failed to save checkin location:", error);
      toast.error("체크인 위치 저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const location: CheckinLocation = {
      address: address.trim(),
      lat: Number(lat),
      lng: Number(lng),
      radiusMeters: radius,
    };
    if (!location.address) {
      toast.error("주소를 입력해주세요.");
      return;
    }
    if (
      !lat.trim() ||
      !lng.trim() ||
      !isValidCheckinArea(location) ||
      !isInKorea(location.lat, location.lng)
    ) {
      toast.error("좌표가 올바르지 않아요. '좌표 찾기'를 먼저 눌러주세요.");
      return;
    }
    void persist(location);
  };

  const reset = () => {
    setAddress("");
    setLat("");
    setLng("");
    setRadius(DEFAULT_RADIUS_METERS);
    void persist(null);
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            체크인 위치
          </h2>
          <p className="text-sm text-muted-foreground">
            외부 장소에서 모임을 할 때 주소와 반경을 지정하세요. 지정하지 않으면
            강남구 라운지 기준으로 판정합니다.
          </p>
        </div>
        <span
          className={`rounded px-2 py-1 text-xs font-semibold ${
            saved ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground"
          }`}
        >
          {saved
            ? `적용 중: ${saved.address} · 반경 ${formatRadius(saved.radiusMeters)}`
            : "적용 중: 기본(강남구 라운지)"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="checkin-address">주소</Label>
          <div className="flex gap-2">
            <Input
              id="checkin-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) geocodeAddress();
              }}
              placeholder="예: 서울 마포구 마포대로 122"
            />
            <Button type="button" variant="outline" onClick={geocodeAddress} disabled={busy}>
              <Search className="mr-1 h-4 w-4" />
              좌표 찾기
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>허용 반경</Label>
          <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((meters) => (
                <SelectItem key={meters} value={String(meters)}>
                  {formatRadius(meters)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="checkin-lat">위도</Label>
          <Input
            id="checkin-lat"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-36"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkin-lng">경도</Label>
          <Input
            id="checkin-lng"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-36"
          />
        </div>
        <Button type="button" variant="ghost" onClick={fillMyPosition} disabled={busy}>
          <LocateFixed className="mr-1 h-4 w-4" />내 위치
        </Button>
        {lat && lng && (
          <a
            href={`https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pb-2 text-sm text-primary underline underline-offset-2"
          >
            지도에서 확인
          </a>
        )}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={reset} disabled={busy || !saved}>
            <RotateCcw className="mr-1 h-4 w-4" />
            기본으로
          </Button>
          <Button type="button" onClick={save} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            저장
          </Button>
        </div>
      </div>
    </section>
  );
}
