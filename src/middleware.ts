import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

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
