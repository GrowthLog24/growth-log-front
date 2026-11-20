"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { AdminSidebar, AdminSidebarNav } from "./AdminSidebar";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const emptySubscribe = () => () => {};

/**
 * 관리자 페이지 전체 레이아웃
 */
export function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();
  // Radix UI ID hydration 불일치 방지를 위해 클라이언트 마운트 후 렌더링
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  // 현재 경로와 연동하여 라우트 전환(뒤로가기 포함) 시 모바일 드로어 자동 닫힘
  const [openedPath, setOpenedPath] = useState<string | null>(null);
  const mobileNavOpen = openedPath === pathname;
  const setMobileNavOpen = (open: boolean) => {
    setOpenedPath(open ? pathname : null);
  };

  return (
    <div className="min-h-screen bg-gray-6">
      {/* 상단 헤더 - 전체 너비 */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-b-gray-5 bg-white">
        <div className="flex h-14 items-center justify-between gap-2 px-4 lg:px-6">
          {/* 좌측: 모바일 메뉴 버튼 + 로고 */}
          <div className="flex min-w-0 items-center gap-2">
            {mounted ? (
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-ml-2 lg:hidden"
                    aria-label="관리자 메뉴 열기"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 gap-0 p-0">
                  <SheetHeader className="border-b border-gray-5 px-4 py-3.5 text-left">
                    <SheetTitle className="sr-only">관리자 메뉴</SheetTitle>
                    <Link
                      href="/admin"
                      onClick={() => setMobileNavOpen(false)}
                      className="flex items-center"
                    >
                      <Image
                        src="/images/logo/logo-light.svg"
                        alt="Growth Log"
                        width={140}
                        height={28}
                        className="h-7 w-auto"
                      />
                    </Link>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">
                    <AdminSidebarNav onNavigate={() => setMobileNavOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 lg:hidden"
                aria-label="관리자 메뉴 열기"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            <Link href="/admin" className="flex shrink-0 items-center">
              <Image
                src="/images/logo/logo-light.svg"
                alt="Growth Log"
                width={175}
                height={35}
                className="h-7 w-auto sm:h-9"
              />
            </Link>
          </div>

          {/* 우측 사용자 정보 */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex shrink-0 items-center gap-1 text-sm text-gray-black hover:text-primary transition-colors outline-none">
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
          ) : (
            <span className="shrink-0 text-sm text-gray-black">
              {user?.name || "관리자"} 님
            </span>
          )}
        </div>
      </header>

      {/* 사이드바 - 데스크톱(lg 이상)에서만 고정 표시 */}
      <AdminSidebar />

      {/* 메인 컨텐츠 영역 */}
      <div className="pt-14 lg:ml-56">
        <main className="min-w-0 p-4 sm:p-6">{children}</main>
      </div>

      {/* Toast 알림 */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
