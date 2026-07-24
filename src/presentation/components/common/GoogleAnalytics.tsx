"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // 내부 운영 화면의 방문 기록은 공개 웹사이트 통계에서 제외
  if (pathname.startsWith("/admin") || !measurementId) {
    return null;
  }

  const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  const scriptContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;

  return (
    <>
      <Script src={scriptSrc} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {scriptContent}
      </Script>
    </>
  );
}
