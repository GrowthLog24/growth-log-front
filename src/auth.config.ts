import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth Provider 설정
 * Edge 런타임에서 사용 가능한 설정만 포함
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminPage = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname === "/admin/login";

      // 로그인 페이지는 항상 접근 가능
      if (isLoginPage) {
        // 이미 로그인했으면 대시보드로 리다이렉트
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return true;
      }

      // 관리자 페이지는 로그인 필요
      if (isAdminPage) {
        if (isLoggedIn) return true;
        return false; // 로그인 페이지로 리다이렉트
      }

      return true;
    },
  },
};
