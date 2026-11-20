"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/shared/constants/admin";

interface AdminSidebarNavProps {
  onNavigate?: () => void;
}

/**
 * 관리자 사이드바 네비게이션 목록 (데스크톱 사이드바·모바일 드로어 공용)
 */
export function AdminSidebarNav({ onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-white"
                : "text-gray-1 hover:bg-gray-6 hover:text-gray-black"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-gray-2 px-2 py-0.5 text-xs text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * 관리자 좌측 사이드바 컴포넌트 (데스크톱 전용, lg 이상 표시)
 */
export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-56 overflow-y-auto border-r border-gray-5 bg-white lg:block">
      <AdminSidebarNav />
    </aside>
  );
}
