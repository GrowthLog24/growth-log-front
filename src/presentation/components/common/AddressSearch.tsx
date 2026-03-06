"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddressSearchProps {
  value: string;
  detailValue?: string;
  onChange: (address: string) => void;
  onDetailChange?: (detail: string) => void;
  placeholder?: string;
  detailPlaceholder?: string;
}

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: () => void;
      }) => { open: () => void };
    };
  }
}

interface DaumPostcodeData {
  zonecode: string; // 우편번호
  address: string; // 기본 주소
  addressEnglish: string; // 영문 주소
  addressType: string; // R(도로명), J(지번)
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  buildingName: string; // 건물명
}

/**
 * 다음 우편번호 서비스를 이용한 주소 검색 컴포넌트
 */
export function AddressSearch({
  value,
  detailValue = "",
  onChange,
  onDetailChange,
  placeholder = "주소 검색 버튼을 클릭하세요",
  detailPlaceholder = "상세 주소를 입력하세요",
}: AddressSearchProps) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // 이미 로드된 경우 스킵
    if (scriptLoaded.current || window.daum) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
    };
    document.head.appendChild(script);

    return () => {
      // cleanup은 하지 않음 (전역 스크립트)
    };
  }, []);

  const handleSearch = () => {
    if (!window.daum) {
      console.error("Daum Postcode script not loaded");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        // 도로명 주소 우선, 없으면 지번 주소
        const fullAddress = data.roadAddress || data.jibunAddress;
        // 건물명이 있으면 추가
        const finalAddress = data.buildingName
          ? `${fullAddress} (${data.buildingName})`
          : fullAddress;
        onChange(finalAddress);
      },
    }).open();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>
      {onDetailChange && (
        <Input
          value={detailValue}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={detailPlaceholder}
        />
      )}
    </div>
  );
}
