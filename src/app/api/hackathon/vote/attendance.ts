import { attendanceAdminRepository } from "@/infrastructure/repositories/admin/attendanceAdminRepository";
import { isAttendedStatus } from "./contracts";

/**
 * 해당 회차에 QR 출석 체크(출석·지각)한 회원 ID 집합을 조회합니다.
 *
 * 조회 실패는 삼키지 않고 그대로 던집니다. (일시 오류를 "미출석"으로 오판하지 않기 위해)
 *
 * @param {string} meetingId - 정기모임 회차 문서 ID
 * @returns {Promise<Set<string>>} 출석 회원 ID 집합
 */
export async function getAttendedMemberIds(meetingId: string): Promise<Set<string>> {
  const records = await attendanceAdminRepository.getByMeetingId(meetingId);
  const memberIds = new Set<string>();
  for (const record of records) {
    if (isAttendedStatus(record.status)) memberIds.add(record.memberId);
  }
  return memberIds;
}
