import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Megaphone,
  TrendingUp,
  HelpCircle,
  Rss,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { recruitmentAdminRepository } from "@/infrastructure/repositories/admin/recruitmentAdminRepository";
import { communityBlogAdminRepository } from "@/infrastructure/repositories/admin/communityBlogAdminRepository";
import { activityAdminRepository } from "@/infrastructure/repositories/admin/activityAdminRepository";
import { noticeRepository } from "@/infrastructure/repositories/noticeRepository";
import { faqAdminRepository } from "@/infrastructure/repositories/admin/faqAdminRepository";
import { formatRelativeTime } from "@/shared/utils/date";
import type { Notice, CommunityBlog } from "@/domain/entities";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  href?: string;
}

function StatCard({ title, value, description, icon, href }: StatCardProps) {
  const content = (
    <Card className={href ? "cursor-pointer transition-shadow hover:shadow-md" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface RecentItem {
  id: string;
  title: string;
  type: "notice" | "blog";
  updatedAt: Date;
  href: string;
}

/**
 * 최근 수정된 항목 생성
 */
function buildRecentItems(
  notices: Notice[],
  blogs: CommunityBlog[]
): RecentItem[] {
  const items: RecentItem[] = [
    ...notices.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      type: "notice" as const,
      updatedAt: n.updatedAt?.toDate?.() || new Date(),
      href: `/admin/notices/${n.id}/edit`,
    })),
    ...blogs.slice(0, 5).map((b) => ({
      id: b.id,
      title: b.title,
      type: "blog" as const,
      updatedAt: b.updatedAt?.toDate?.() || new Date(),
      href: `/admin/community-blogs`,
    })),
  ];

  return items
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);
}

/**
 * Firestore에서 대시보드 통계 데이터 조회
 */
async function getDashboardData() {
  try {
    const [preRegistrations, communityBlogs, activities, notices, faqs] = await Promise.all([
      recruitmentAdminRepository.getPreRegistrations(),
      communityBlogAdminRepository.getAllBlogs(),
      activityAdminRepository.getAllActivities(),
      noticeRepository.getNotices(),
      faqAdminRepository.getAllFAQs(),
    ]);

    return {
      stats: {
        totalPreRegistrations: preRegistrations.length,
        totalCommunityBlogs: communityBlogs.length,
        totalActivities: activities.length,
        totalNotices: notices.length,
        totalFaqs: faqs.length,
      },
      recentItems: buildRecentItems(notices, communityBlogs),
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      stats: {
        totalPreRegistrations: 0,
        totalCommunityBlogs: 0,
        totalActivities: 0,
        totalNotices: 0,
        totalFaqs: 0,
      },
      recentItems: [],
    };
  }
}

/**
 * 관리자 대시보드 페이지
 */
export default async function AdminDashboardPage() {
  const [{ stats, recentItems }, session] = await Promise.all([
    getDashboardData(),
    auth(),
  ]);

  const userName = session?.user?.name || "관리자";

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div>
        <h2 className="text-lg font-medium">안녕하세요, {userName}님!</h2>
        <p className="text-muted-foreground">
          Growth Log 백오피스에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="사전등록"
          value={stats.totalPreRegistrations}
          description="사전등록 신청자 수"
          icon={<Users className="h-4 w-4" />}
          href="/admin/recruitment"
        />
        <StatCard
          title="커뮤니티 블로그"
          value={stats.totalCommunityBlogs}
          description="등록된 게시물"
          icon={<Rss className="h-4 w-4" />}
          href="/admin/community-blogs"
        />
        <StatCard
          title="활동 기록"
          value={stats.totalActivities}
          description="등록된 활동"
          icon={<FolderKanban className="h-4 w-4" />}
          href="/admin/activities"
        />
        <StatCard
          title="공지사항"
          value={stats.totalNotices}
          description="등록된 공지사항"
          icon={<Megaphone className="h-4 w-4" />}
          href="/admin/notices"
        />
        <StatCard
          title="FAQ"
          value={stats.totalFaqs}
          description="등록된 FAQ"
          icon={<HelpCircle className="h-4 w-4" />}
          href="/admin/faqs"
        />
      </div>

      {/* 빠른 작업 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              빠른 작업
            </CardTitle>
            <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href="/admin/community-blogs"
              className="flex items-center gap-2 rounded-lg bg-gray-6 p-3 hover:bg-gray-5 transition-colors"
            >
              <Rss className="h-4 w-4" />
              커뮤니티 블로그 관리
            </Link>
            <Link
              href="/admin/notices/create"
              className="flex items-center gap-2 rounded-lg bg-gray-6 p-3 hover:bg-gray-5 transition-colors"
            >
              <Megaphone className="h-4 w-4" />
              새 공지사항 작성
            </Link>
            <Link
              href="/admin/recruitment"
              className="flex items-center gap-2 rounded-lg bg-gray-6 p-3 hover:bg-gray-5 transition-colors"
            >
              <Users className="h-4 w-4" />
              사전등록 목록 확인
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              최근 활동
            </CardTitle>
            <CardDescription>최근에 수정된 항목들</CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                아직 기록된 활동이 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {recentItems.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-6 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {item.type === "notice" ? "공지" : "블로그"}
                      </Badge>
                      <span className="text-sm truncate">{item.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatRelativeTime(item.updatedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
