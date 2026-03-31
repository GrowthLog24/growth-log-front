import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { SITE_METADATA } from "@/shared/constants";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: SITE_METADATA.title,
    template: `%s | ${SITE_METADATA.title}`,
  },
  description: SITE_METADATA.description,
  metadataBase: new URL(SITE_METADATA.url),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_METADATA.url,
    siteName: SITE_METADATA.title,
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  verification: {
    google: "88ziDUAadCqKBdYYPifKi_USWyroItS2b5awIefZ3SQ",
    // TODO: 네이버 서치 어드바이저 인증 코드 추가
    // https://searchadvisor.naver.com/ 에서 사이트 등록 후 발급
    // other: {
    //   "naver-site-verification": "여기에_네이버_인증_코드_입력",
    // },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
