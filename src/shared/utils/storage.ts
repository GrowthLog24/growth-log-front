/**
 * Firebase Storage URL 생성 유틸리티
 */

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET;

/**
 * Firebase Storage 경로를 다운로드 URL로 변환
 *
 * @param path - Storage 내 파일 경로 (예: "common/hero-bg.jpg")
 * @returns 다운로드 가능한 URL
 *
 * @example
 * getStorageUrl("common/hero-bg.jpg")
 * // => "https://firebasestorage.googleapis.com/v0/b/growth-log-74954.firebasestorage.app/o/common%2Fhero-bg.jpg?alt=media"
 */
export function getStorageUrl(path: string): string {
  if (!STORAGE_BUCKET) {
    console.warn("NEXT_PUBLIC_STORAGE_BUCKET is not defined");
    return `/images/${path.split("/").pop()}`; // fallback to public folder
  }

  // 경로를 URL 인코딩 (슬래시를 %2F로 변환)
  const encodedPath = encodeURIComponent(path);

  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
}

/**
 * 공용 이미지/영상 경로 상수
 */
export const STORAGE_PATHS = {
  // 공용 이미지/영상
  HERO_BG_VIDEO: "common/hero-bg.mp4",
  TEAM_PHOTO: "common/team-photo.webp",
  RECRUIT_PHOTO: "common/recruit-photo.webp",
  OG_IMAGE: "common/og-image.jpg",

  // 활동 썸네일 경로 생성 헬퍼
  activityThumb: (year: number | string, activityId: string) =>
    `activities/${year}/${activityId}/thumb.jpg`,

  // 활동 본문 내 이미지 경로 생성 헬퍼
  activityContent: (year: number | string, activityId: string, filename: string) =>
    `activities/${year}/${activityId}/content/${filename}`,
} as const;

/**
 * 공용 이미지/영상 URL 바로 가져오기
 */
export const STORAGE_URLS = {
  heroBgVideo: () => getStorageUrl(STORAGE_PATHS.HERO_BG_VIDEO),
  teamPhoto: () => getStorageUrl(STORAGE_PATHS.TEAM_PHOTO),
  recruitPhoto: () => getStorageUrl(STORAGE_PATHS.RECRUIT_PHOTO),
  ogImage: () => getStorageUrl(STORAGE_PATHS.OG_IMAGE),
} as const;
