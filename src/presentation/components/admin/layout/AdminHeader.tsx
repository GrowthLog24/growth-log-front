"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ADMIN_PAGE_TITLES } from "@/shared/constants/admin";

interface AdminHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * 관리자 상단 헤더 컴포넌트
 */
export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();

  // 현재 페이지 제목 찾기
  const getPageTitle = () => {
    // 정확한 매치 먼저 확인
    if (ADMIN_PAGE_TITLES[pathname]) {
      return ADMIN_PAGE_TITLES[pathname];
    }

    // 하위 경로 확인 (예: /admin/notices/create -> 공지사항)
    for (const [path, title] of Object.entries(ADMIN_PAGE_TITLES)) {
      if (pathname.startsWith(path) && path !== "/admin") {
        return title;
      }
    }

    return "관리자";
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      {/* 페이지 제목 */}
      <h1 className="text-xl font-semibold">{getPageTitle()}</h1>

      {/* 사용자 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.name || "사용자"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
