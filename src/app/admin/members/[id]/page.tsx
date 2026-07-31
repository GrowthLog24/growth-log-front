"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MemberProfileForm,
  MemberAttendancePanel,
  MemberGrowthLogPanel,
  MemberProjectPanel,
} from "@/presentation/components/admin/member";
import { memberAdminRepository } from "@/infrastructure/repositories/admin/memberAdminRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import type { Member } from "@/domain/entities";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 회원 상세 페이지
 *
 * 한 회원의 기본 정보·출결·성장일지·참여 프로젝트를
 * 한 화면에서 모두 입력할 수 있습니다.
 */
export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = use(params);

  const [member, setMember] = useState<Member | null>(null);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [found, siteConfig] = await Promise.all([
          memberAdminRepository.getById(id),
          siteConfigRepository.getSiteConfig(),
        ]);
        setMember(found);
        setCurrentGeneration(siteConfig?.currentGeneration ?? 0);
      } catch (error) {
        console.error("Failed to fetch member:", error);
        toast.error("회원 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">회원을 찾을 수 없습니다.</p>
        <Button asChild variant="outline">
          <Link href="/admin/members">멤버 목록으로</Link>
        </Button>
      </div>
    );
  }

  const achievementUrl = `/member/${member.generation}/${encodeURIComponent(member.memberName)}`;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" title="목록으로">
            <Link href="/admin/members">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {member.memberName}
              </h1>
              <Badge variant="secondary">{member.generation}기</Badge>
              <Badge
                variant={member.memberType === "신입회원" ? "default" : "outline"}
              >
                {member.memberType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              업적 페이지에 표시될 정보를 여기서 모두 관리합니다.
            </p>
          </div>
        </div>

        <Button asChild variant="outline">
          <a href={achievementUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1 h-4 w-4" />
            업적 페이지 보기
          </a>
        </Button>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">기본 정보</TabsTrigger>
          <TabsTrigger value="attendance">정기모임 출결</TabsTrigger>
          <TabsTrigger value="growth-log">성장일지</TabsTrigger>
          <TabsTrigger value="project">참여 프로젝트</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <MemberProfileForm
            member={member}
            currentGeneration={currentGeneration}
            onSaved={setMember}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <MemberAttendancePanel member={member} />
        </TabsContent>

        <TabsContent value="growth-log" className="mt-4">
          <MemberGrowthLogPanel member={member} />
        </TabsContent>

        <TabsContent value="project" className="mt-4">
          <MemberProjectPanel member={member} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
