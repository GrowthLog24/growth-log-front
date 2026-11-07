"use client";

import { useEffect, useState } from "react";
import { createQrPngDataUrl } from "@/shared/utils/qrCode";

/**
 * 주소를 QR PNG DataURL로 만듭니다. 주소가 비어 있거나 생성 전이면 null.
 *
 * @param {string} url - QR에 담을 주소
 * @returns {string | null} DataURL
 */
export function useQrDataUrl(url: string): string | null {
  const [result, setResult] = useState<{ url: string; dataUrl: string } | null>(null);

  useEffect(() => {
    if (!url) return;
    let isCancelled = false;
    createQrPngDataUrl(url)
      .then((dataUrl) => {
        if (!isCancelled) setResult({ url, dataUrl });
      })
      .catch((error: unknown) => {
        console.error("[hackathon-live] QR 생성 실패", error);
      });
    return () => {
      isCancelled = true;
    };
  }, [url]);

  return result && result.url === url ? result.dataUrl : null;
}
