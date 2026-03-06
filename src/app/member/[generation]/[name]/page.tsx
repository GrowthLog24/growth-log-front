import { redirect } from "next/navigation";
import Link from "next/link";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memberRepository } from "@/infrastructure/repositories/memberRepository";

interface MemberPageProps {
  params: Promise<{
    generation: string;
    name: string;
  }>;
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { generation, name } = await params;
  const generationNum = Number(generation);
  const decodedName = decodeURIComponent(name);

  if (isNaN(generationNum)) {
    return <NotFoundView />;
  }

  const member = await memberRepository.findByGenerationAndName(
    generationNum,
    decodedName
  );

  if (member?.redirectUrl) {
    redirect(member.redirectUrl);
  }

  return <NotFoundView />;
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
