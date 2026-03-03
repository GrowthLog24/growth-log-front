import { Timestamp } from "firebase/firestore";

/**
 * Firestore Timestamp를 Date 객체로 변환
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * 날짜를 "YYYY.MM.DD" 형식으로 포맷
 */
export function formatDate(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

/**
 * 날짜를 "YYYY년 MM월 DD일" 형식으로 포맷
 */
export function formatDateKorean(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 날짜를 "MM월 DD일 (요일)" 형식으로 포맷
 */
export function formatDateWithDay(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[d.getDay()];
  return `${month}월 ${day}일 (${dayName})`;
}

/**
 * 상대적 시간 표시 (예: "3일 전", "2시간 전")
 */
export function formatRelativeTime(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffYear > 0) return `${diffYear}년 전`;
  if (diffMonth > 0) return `${diffMonth}개월 전`;
  if (diffDay > 0) return `${diffDay}일 전`;
  if (diffHour > 0) return `${diffHour}시간 전`;
  if (diffMin > 0) return `${diffMin}분 전`;
  return "방금 전";
}
