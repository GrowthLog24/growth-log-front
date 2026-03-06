import {
  LayoutDashboard,
  Settings,
  Megaphone,
  HelpCircle,
  Users,
  FolderKanban,
  MessageSquare,
  CalendarDays,
  Rss,
  UserRoundSearch,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

/**
 * 관리자 네비게이션 아이템 타입
 */
export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: AdminNavItem[];
}

/**
 * 관리자 네비게이션 아이템 목록
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: "대시보드",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "모집/사전등록 신청",
    href: "/admin/recruitment",
    icon: Users,
  },
  {
    title: "커뮤니티 블로그",
    href: "/admin/community-blogs",
    icon: Rss,
  },
  {
    title: "활동 기록",
    href: "/admin/activities",
    icon: FolderKanban,
  },
  {
    title: "멤버 후기",
    href: "/admin/testimonials",
    icon: MessageSquare,
  },
  {
    title: "공지사항",
    href: "/admin/notices",
    icon: Megaphone,
  },
  {
    title: "FAQ",
    href: "/admin/faqs",
    icon: HelpCircle,
  },
  {
    title: "월별 일정",
    href: "/admin/schedules",
    icon: CalendarDays,
  },
  {
    title: "멤버 관리",
    href: "/admin/members",
    icon: UserRoundSearch,
  },
  {
    title: "행사 타임테이블",
    href: "/admin/events",
    icon: CalendarClock,
  },
  {
    title: "사이트 정보 설정",
    href: "/admin/settings",
    icon: Settings,
  },
];

/**
 * 관리자 페이지 제목 맵
 */
export const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "대시보드",
  "/admin/recruitment": "모집/사전등록 신청",
  "/admin/community-blogs": "커뮤니티 블로그",
  "/admin/activities": "활동 기록",
  "/admin/testimonials": "멤버 후기",
  "/admin/notices": "공지사항",
  "/admin/faqs": "FAQ",
  "/admin/schedules": "월별 일정",
  "/admin/members": "멤버 관리",
  "/admin/events": "행사 타임테이블",
  "/admin/settings": "사이트 정보 설정",
};
