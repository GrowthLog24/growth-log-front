import type { MetadataRoute } from "next";

import { SITE_METADATA } from "@/shared/constants";

/**
 * 검색 엔진 크롤러를 위한 robots.txt 생성
 *
 * - 모든 크롤러에 대해 공개 페이지 크롤링 허용
 * - /admin 경로는 크롤링 차단
 * - /api 경로는 크롤링 차단
 * - sitemap.xml 위치 명시
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_METADATA.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
