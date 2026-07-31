import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { IS_ADMIN_AUTH_BYPASSED } from "@/shared/constants/devAuth";

const { auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

/**
 * 미들웨어: 서브도메인 감지 및 인증 처리
 *
 * - admin.* 서브도메인 접근 시 /admin 경로로 리라이트
 * - /admin 경로는 인증 필요
 */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // 정적 파일, API, _next 등은 무시
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // 정적 파일
  ) {
    return NextResponse.next();
  }

  // 서브도메인 감지 (admin.localhost:3000 또는 admin.domain.com)
  const isAdminSubdomain =
    hostname.startsWith("admin.") ||
    hostname.startsWith("admin-");

  // admin 서브도메인에서 접근하면 /admin 경로로 리라이트
  if (isAdminSubdomain && !pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // /admin 경로 인증 처리
  if (pathname.startsWith("/admin")) {
    // 로컬 개발 전용 우회 (프로덕션 빌드에서는 항상 false)
    if (IS_ADMIN_AUTH_BYPASSED) {
      // 우회 중에는 로그인이 필요 없으므로, 로그인 페이지로 들어오면
      // 대시보드로 보냅니다. (OAuth 미설정 상태에서 로그인 버튼을 눌러
      // invalid_client 에러를 만나는 혼란을 막기 위함)
      if (pathname === "/admin/login") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // @ts-expect-error - NextAuth의 auth 함수 타입 이슈
    return auth(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 경로는 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
