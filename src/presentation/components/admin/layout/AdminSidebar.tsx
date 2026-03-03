"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/shared/constants/admin";

/**
 * 관리자 좌측 사이드바 컴포넌트
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-56 border-r border-gray-5 bg-white">
      {/* 네비게이션 */}
      <nav className="flex flex-col gap-1 p-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-1 hover:bg-gray-6 hover:text-gray-black"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
              {item.badge && (
                <span className="ml-auto rounded-full bg-gray-2 px-2 py-0.5 text-xs text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
