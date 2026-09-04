import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMemberAchievement } from "@/application/services/memberAchievementService";
import {
  AchievementHero,
  AchievementStats,
  AttendanceTimeline,
  BadgeGrid,
  GrowthLogList,
  MemberMotion,
  ProjectList,
} from "@/presentation/components/member";
import { MemberCheckInGate } from "@/presentation/components/checkin/MemberCheckInGate";

interface MemberPageProps {
  params: Promise<{
    generation: string;
    name: string;
  }>;
}

/**
 * 요청 단위 메모이즈된 업적 조회
 *
 * generateMetadata와 페이지 본문이 같은 데이터를 필요로 하므로,
 * React cache로 감싸 Firestore 쿼리가 중복 실행되지 않게 합니다.
 */
const loadAchievement = cache(getMemberAchievement);

/**
 * 라우트 파라미터를 검증된 값으로 변환합니다.
 *
 * 기수가 숫자가 아니면 null을 반환합니다.
 */
function parseParams(generation: string, name: string) {
  const generationNum = Number(generation);
  if (!Number.isInteger(generationNum) || generationNum <= 0) return null;

  const decodedName = decodeURIComponent(name).trim();
  if (!decodedName) return null;

  return { generation: generationNum, name: decodedName };
}

export async function generateMetadata({
  params,
}: MemberPageProps): Promise<Metadata> {
  const { generation, name } = await params;
  const parsed = parseParams(generation, name);
  if (!parsed) return { title: "회원 정보를 찾을 수 없습니다" };

  const achievement = await loadAchievement(parsed.generation, parsed.name);
  if (!achievement) return { title: "회원 정보를 찾을 수 없습니다" };

  const { member, level, attendance, growthLogs } = achievement;
  const title = `${member.generation}기 ${member.memberName}의 성장 기록`;
  const description = `Lv.${level.level} ${level.title} · 출석률 ${attendance.attendanceRate}% · 성장일지 ${growthLogs.length}편`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
  };
}

/**
 * 회원 업적 페이지
 *
 * QR 코드로 진입하는 개인 경력 증빙 페이지입니다.
 * 정기모임 출결, 성장일지 제출 이력, 참여 프로젝트를
 * 레벨·배지 형태로 시각화합니다.
 */
export default async function MemberPage({ params }: MemberPageProps) {
  const { generation, name } = await params;
  const parsed = parseParams(generation, name);

  if (!parsed) {
    return <NotFoundView />;
  }

  const achievement = await loadAchievement(parsed.generation, parsed.name);

  if (!achievement) {
    return <NotFoundView />;
  }

  return (
    <main className="overflow-hidden bg-white pb-12">
      <MemberCheckInGate
        memberId={achievement.member.id}
        memberName={achievement.member.memberName}
        memberIsActive={achievement.member.isActive}
        memberGeneration={achievement.member.generation}
      />
      <MemberMotion>
        <AchievementHero member={achievement.member} level={achievement.level} />
        <AchievementStats
          attendance={achievement.attendance}
          growthLogCount={achievement.growthLogs.length}
          projectCount={achievement.projects.length}
        />
        <BadgeGrid badges={achievement.badges} />
        <AttendanceTimeline attendance={achievement.attendance} />
        <GrowthLogList logs={achievement.growthLogs} />
        <ProjectList projects={achievement.projects} />
      </MemberMotion>
    </main>
  );
}

function NotFoundView() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <UserX className="w-16 h-16 text-muted-foreground/40 mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">
          아직 등록되지 않은 회원 정보입니다.
        </h1>
        <p className="text-muted-foreground">
          요청하신 회원 페이지를 찾을 수 없습니다.
        </p>
        <Button asChild variant="outline">
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    </section>
  );
}
