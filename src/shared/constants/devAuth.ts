/**
 * 로컬 개발용 관리자 인증 우회 플래그
 *
 * Google OAuth 자격증명 없이 로컬에서 관리자 화면을 사용하기 위한 장치입니다.
 * 아래 두 조건이 **모두** 참일 때만 활성화됩니다.
 *
 * 1. `NODE_ENV === "development"`
 *    `next build`는 항상 production으로 빌드하므로 배포 번들에서는 상수 false로 접힙니다.
 * 2. `ADMIN_AUTH_BYPASS === "true"`
 *    `.env.local`에만 존재하는 값으로, 배포 환경에 설정하지 않으면 켜질 수 없습니다.
 *
 * ⚠️ 배포 환경에는 `ADMIN_AUTH_BYPASS`를 절대 설정하지 마세요.
 *    설정되는 순간 관리자 페이지 전체가 무인증으로 열립니다.
 */
export const IS_ADMIN_AUTH_BYPASSED =
  process.env.NODE_ENV === "development" &&
  process.env.ADMIN_AUTH_BYPASS === "true";

if (IS_ADMIN_AUTH_BYPASSED) {
  console.warn(
    "\n⚠️  [개발 모드] 관리자 인증이 우회되고 있습니다 (ADMIN_AUTH_BYPASS=true).\n" +
      "   작업이 끝나면 .env.local에서 이 값을 제거하세요.\n"
  );
}
