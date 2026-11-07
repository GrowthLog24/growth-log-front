import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import { HackathonConsole } from "@/presentation/components/admin/hackathon/HackathonConsole";

/** 테스트용 행사 ID 허용 형식 (?id=test-admin-agent) */
const HACKATHON_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

/**
 * 해커톤 운영 콘솔 페이지
 *
 * 기본은 이번 행사(CURRENT_HACKATHON_ID)이며, `?id=` 로 테스트 행사를 열 수 있습니다.
 */
export default async function AdminHackathonPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { id } = await searchParams;
  const requested = typeof id === "string" ? id : undefined;
  const hackathonId =
    requested && HACKATHON_ID_PATTERN.test(requested) ? requested : CURRENT_HACKATHON_ID;

  return <HackathonConsole key={hackathonId} hackathonId={hackathonId} />;
}
