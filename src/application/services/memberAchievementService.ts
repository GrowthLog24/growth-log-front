import type { Timestamp } from "firebase/firestore";
import {
  calculateLevel,
  calculateTotalXp,
  evaluateBadges,
  summarizeAttendance,
  type AttendanceRecord,
} from "@/domain/achievements";
import type { GrowthLogActivity, Meeting, ProjectActivity } from "@/domain/entities";
import { memberRepository } from "@/infrastructure/repositories/memberRepository";
import { meetingRepository } from "@/infrastructure/repositories/meetingRepository";
import { attendanceRepository } from "@/infrastructure/repositories/attendanceRepository";
import { activityRepository } from "@/infrastructure/repositories/activityRepository";
import type {
  AttendanceTimelineItemDto,
  GrowthLogSummaryDto,
  MemberAchievementDto,
  ProjectSummaryDto,
} from "@/application/dtos/memberAchievement";

/**
 * Firestore Timestamp를 epoch 밀리초로 변환합니다.
 *
 * 서버 컴포넌트 → 클라이언트 컴포넌트 경계를 넘기 위해
 * 직렬화 가능한 원시값으로 낮춥니다.
 */
function toMillis(timestamp: Timestamp | undefined | null): number | null {
  if (!timestamp) return null;
  try {
    return timestamp.toMillis();
  } catch {
    return null;
  }
}

/**
 * 기수와 이름으로 회원의 업적 데이터를 조립합니다.
 *
 * 회원이 존재하지 않으면 null을 반환합니다.
 *
 * @param {number} generation - 가입 기수
 * @param {string} memberName - 회원 이름
 * @returns {Promise<MemberAchievementDto | null>} 업적 페이지 DTO
 */
export async function getMemberAchievement(
  generation: number,
  memberName: string
): Promise<MemberAchievementDto | null> {
  const member = await memberRepository.findByGenerationAndName(
    generation,
    memberName
  );
  if (!member) return null;

  const identity = {
    memberId: member.id,
    memberName: member.memberName,
    generation: member.generation,
  };

  const [meetings, attendances, growthLogs, projects] = await Promise.all([
    meetingRepository.getFromGeneration(member.generation),
    attendanceRepository.getByMemberId(member.id),
    activityRepository.getGrowthLogsByMember(identity),
    activityRepository.getProjectsByMember(identity),
  ]);

  // 출석률은 정기모임만 집계합니다. 그로스톡 출결은 회차 번호가 정기모임과
  // 겹칠 수 있으므로, 정기모임 회차 문서 ID에 속한 출결만 남깁니다.
  const regularMeetingIds = new Set(meetings.map((meeting) => meeting.id));
  const records: AttendanceRecord[] = attendances
    .filter((attendance) => regularMeetingIds.has(attendance.meetingId))
    .map((attendance) => ({
      generation: attendance.generation,
      round: attendance.round,
      status: attendance.status,
    }));

  const attendanceSummary = summarizeAttendance(
    meetings.map((meeting) => ({
      generation: meeting.generation,
      round: meeting.round,
    })),
    records
  );

  const totalXp = calculateTotalXp(
    attendanceSummary,
    growthLogs.length,
    projects.length
  );
  const level = calculateLevel(totalXp);
  const badges = evaluateBadges({
    totalMeetings: attendanceSummary.totalMeetings,
    attendedCount: attendanceSummary.attendedCount,
    attendanceRate: attendanceSummary.attendanceRate,
    longestStreak: attendanceSummary.longestStreak,
    growthLogCount: growthLogs.length,
    projectCount: projects.length,
  });

  const meetingByKey = new Map<string, Meeting>();
  for (const meeting of meetings) {
    meetingByKey.set(`${meeting.generation}-${meeting.round}`, meeting);
  }

  // 성장일지 엔티티에는 기수가 없어 회차 번호로만 회차를 매칭합니다.
  const meetingByRound = new Map<number, Meeting>();
  for (const meeting of meetings) {
    meetingByRound.set(meeting.round, meeting);
  }

  const timeline: AttendanceTimelineItemDto[] = attendanceSummary.timeline.map(
    (item) => {
      const meeting = meetingByKey.get(`${item.generation}-${item.round}`);
      return {
        generation: item.generation,
        round: item.round,
        status: item.status,
        meetingTitle: meeting?.title ?? `${item.generation}기 ${item.round}회차`,
        meetingDateMs: toMillis(meeting?.meetingDate),
      };
    }
  );

  return {
    member: {
      id: member.id,
      memberName: member.memberName,
      generation: member.generation,
      memberType: member.memberType,
      isActive: member.isActive,
      profileImageUrl: member.profileImageUrl?.trim() || null,
      bio: member.bio?.trim() || null,
      field: member.field?.trim() || null,
    },
    level: {
      level: level.level,
      title: level.title,
      totalXp: level.totalXp,
      nextLevelXp: level.nextLevelXp,
      currentLevelXp: level.currentLevelXp,
      progressRate: level.progressRate,
      xpToNextLevel: level.xpToNextLevel,
    },
    attendance: {
      totalMeetings: attendanceSummary.totalMeetings,
      presentCount: attendanceSummary.presentCount,
      lateCount: attendanceSummary.lateCount,
      excusedCount: attendanceSummary.excusedCount,
      absentCount: attendanceSummary.absentCount,
      attendedCount: attendanceSummary.attendedCount,
      attendanceRate: attendanceSummary.attendanceRate,
      currentStreak: attendanceSummary.currentStreak,
      longestStreak: attendanceSummary.longestStreak,
      timeline,
    },
    badges,
    growthLogs: growthLogs.map((log) => toGrowthLogDto(log, meetingByRound)),
    projects: projects.map((project) => toProjectDto(project, member.memberName)),
  };
}

/**
 * 성장일지 엔티티를 DTO로 변환합니다.
 */
function toGrowthLogDto(
  log: GrowthLogActivity,
  meetingByRound: ReadonlyMap<number, Meeting>
): GrowthLogSummaryDto {
  // 회차 미지정 값은 0으로 저장되므로 null로 정규화합니다.
  const round = log.round && log.round > 0 ? log.round : null;
  const meeting = round !== null ? meetingByRound.get(round) : undefined;

  return {
    id: log.id,
    title: log.title,
    field: log.field ?? "",
    excerpt: log.excerpt ?? "",
    blogUrl: log.blogUrl,
    thumbnailUrl: log.thumbnailUrl ?? "",
    round,
    meetingTitle: meeting?.title ?? null,
    meetingDateMs: toMillis(meeting?.meetingDate),
  };
}

/**
 * 프로젝트 엔티티를 DTO로 변환합니다.
 */
function toProjectDto(
  project: ProjectActivity,
  memberName: string
): ProjectSummaryDto {
  return {
    id: project.id,
    projectName: project.projectName,
    platform: project.platform ?? "",
    description: project.description ?? "",
    thumbnailUrl: project.thumbnailUrl ?? "",
    blogUrl: project.blogUrl ?? "",
    generation: project.generation,
    role: project.leaderName === memberName ? "리더" : "팀원",
  };
}
