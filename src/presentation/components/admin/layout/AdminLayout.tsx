"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import { AdminSidebar } from "./AdminSidebar";
import { Toaster } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * 관리자 페이지 전체 레이아웃
 */
export function AdminLayout({ children, user }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-6">
      {/* 상단 헤더 - 전체 너비 */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-b-gray-5 bg-white">
        <div className="flex h-14 items-center justify-between px-6">
          {/* 좌측 로고 */}
          <Link href="/admin" className="flex items-center">
            <Image
              src="/images/logo/logo-light.svg"
              alt="Growth Log"
              width={175}
              height={35}
              className="h-9 w-auto"
            />
          </Link>

          {/* 우측 사용자 정보 */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-gray-black hover:text-primary transition-colors outline-none">
              <span>{user?.name || "관리자"} 님</span>
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/" target="_blank">
                  사이트 보기
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/admin/login" })}>
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 사이드바 - 헤더 아래 */}
      <AdminSidebar />

      {/* 메인 컨텐츠 영역 */}
      <div className="ml-56 pt-14">
        <main className="p-6">{children}</main>
      </div>

      {/* Toast 알림 */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
