import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  FileText,
  Megaphone,
  ClipboardList,
  TrendingUp,
  Activity,
} from "lucide-react";
import Link from "next/link";

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

/**
 * 관리자 대시보드 페이지
 */
export default async function AdminDashboardPage() {
  // TODO: 실제 데이터를 Firestore에서 가져오기
  const stats = {
    totalMembers: 150,
    activeActivities: 12,
    totalNotices: 25,
    preRegistrations: 45,
  };

  return (
    // TODO: 관리자  실제 로그인한 사용자로 이름 변경
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div>
        <h2 className="text-lg font-medium">안녕하세요, 관리자님!</h2>
        <p className="text-muted-foreground">
          Growth Log 백오피스에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="총 멤버 수"
          value={stats.totalMembers}
          description="현재까지 등록된 멤버"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="활동 게시물"
          value={stats.activeActivities}
          description="공개된 활동 수"
          icon={<Activity className="h-4 w-4" />}
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
          title="사전등록"
          value={stats.preRegistrations}
          description="이번 기수 신청자"
          icon={<ClipboardList className="h-4 w-4" />}
          href="/admin/recruitment"
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
              href="/admin/notices/create"
              className="flex items-center gap-2 rounded-lg bg-gray-6 p-3 hover:bg-gray-5 transition-colors"
            >
              <Megaphone className="h-4 w-4" />
              새 공지사항 작성
            </Link>
            <Link
              href="/admin/activities/create"
              className="flex items-center gap-2 rounded-lg bg-gray-6 p-3 hover:bg-gray-5 transition-colors"
            >
              <Activity className="h-4 w-4" />
              새 활동 등록
            </Link>
            <Link
              href="/admin/recruitment"
              className="flex items-center gap-2 rounded-lg bg-gray-6 p-3 hover:bg-gray-5 transition-colors"
            >
              <ClipboardList className="h-4 w-4" />
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
            <p className="text-sm text-muted-foreground">
              아직 기록된 활동이 없습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
