import type { MetadataRoute } from "next";

import { SITE_METADATA } from "@/shared/constants";

/**
 * 검색 엔진을 위한 동적 sitemap.xml 생성
 *
 * 정적 페이지와 동적 페이지의 URL을 제공하여
 * 검색 엔진이 사이트를 효율적으로 인덱싱할 수 있도록 함
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_METADATA.url;

  // 정적 페이지 목록
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/activity`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/recruit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // TODO: 동적 페이지 (activity/[id], support/notice/[id]) 추가 시
  // Firestore에서 데이터를 가져와 URL 목록 생성 가능
  // 예시:
  // const activities = await activityRepository.getAll();
  // const activityPages = activities.map((activity) => ({
  //   url: `${baseUrl}/activity/${activity.id}`,
  //   lastModified: activity.updatedAt,
  //   changeFrequency: "monthly" as const,
  //   priority: 0.6,
  // }));

  return staticPages;
}
