import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { userRepository } from "@/infrastructure/repositories/admin/userRepository";
import type { UserRole } from "@/domain/entities";

/**
 * 확장된 세션 타입
 */
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Google 로그인만 허용
      if (account?.provider !== "google") {
        return false;
      }

      if (!user.email) {
        return false;
      }

      try {
        // Firestore에서 사용자 조회
        const existingUser = await userRepository.getUserByEmail(user.email);

        if (!existingUser) {
          // 등록되지 않은 사용자는 로그인 불가
          // 관리자가 먼저 Firestore에 사용자를 등록해야 함
          console.warn(`Unauthorized login attempt: ${user.email}`);
          return false;
        }

        // 역할이 admin 또는 editor인 경우만 허용
        if (existingUser.role !== "admin" && existingUser.role !== "editor") {
          console.warn(`User ${user.email} has insufficient role: ${existingUser.role}`);
          return false;
        }

        // 프로필 정보 업데이트
        await userRepository.updateUser(user.email, {
          name: user.name || existingUser.name,
          image: user.image || existingUser.image,
        });

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async session({ session }) {
      if (session.user?.email) {
        try {
          // Firestore에서 사용자 역할 조회
          const user = await userRepository.getUserByEmail(session.user.email);
          if (user) {
            session.user.role = user.role;
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
});
