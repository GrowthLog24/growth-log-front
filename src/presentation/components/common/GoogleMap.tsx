"use client";

import { useCallback, useState } from "react";
import { GoogleMap as GoogleMapComponent, useJsApiLoader, Marker } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

interface GoogleMapProps {
  address: string;
  className?: string;
  /** 줌 레벨 (기본값: 17) */
  zoom?: number;
}

// 지도 컨테이너 스타일
const containerStyle = {
  width: "100%",
  height: "100%",
};

// 깔끔한 지도 옵션 - UI 컨트롤만 숨기고 지도 내용은 그대로
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true, // 기본 UI 컨트롤 숨기기
  zoomControl: false, // 줌 컨트롤 숨기기
  mapTypeControl: false, // 지도 타입 컨트롤 숨기기
  streetViewControl: false, // 스트리트뷰 버튼 숨기기
  fullscreenControl: false, // 풀스크린 버튼 숨기기
  scaleControl: false, // 스케일 컨트롤 숨기기
  rotateControl: false, // 회전 컨트롤 숨기기
  gestureHandling: "greedy", // 부드러운 스크롤/줌
};

/**
 * Google Maps JavaScript API 컴포넌트
 * 인터랙티브하면서 UI 요소가 제거된 깔끔한 지도
 */
export function GoogleMap({ address, className = "", zoom = 17 }: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [center, setCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [geocodeError, setGeocodeError] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    language: "ko", // 한국어
    region: "KR",
  });

  // 지도 로드 완료 시 주소를 좌표로 변환
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const latLng = { lat: location.lat(), lng: location.lng() };
          setCenter(latLng);
          map.setCenter(latLng);
        } else {
          setGeocodeError(true);
        }
      });
    },
    [address]
  );

  // API 키 없음
  if (!apiKey) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-4 text-muted-foreground ${className}`}>
        Google Maps API 키가 설정되지 않았습니다.
      </div>
    );
  }

  // 로딩 중
  if (!isLoaded) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-4 ${className}`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">지도 로딩 중...</span>
        </div>
      </div>
    );
  }

  // 로드 에러 또는 지오코딩 실패
  if (loadError || geocodeError) {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    return (
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full h-full flex flex-col items-center justify-center bg-gray-4 text-muted-foreground hover:bg-gray-5 transition-colors cursor-pointer ${className}`}
      >
        <MapPin className="w-8 h-8 mb-2 text-primary" />
        <span className="text-sm">지도 보기</span>
        <span className="text-xs mt-1 max-w-[80%] truncate">{address}</span>
      </a>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: "100%", height: "100%" }}>
      <GoogleMapComponent
        mapContainerStyle={containerStyle}
        zoom={zoom}
        onLoad={onLoad}
        options={mapOptions}
      >
        {center && <Marker position={center} />}
      </GoogleMapComponent>
    </div>
  );
}
