import type {
  SiteConfig,
  Stats,
  Notice,
  FAQ,
  Recruitment,
  Activity,
  ActivityDetail,
  Testimonial,
  PreRegistrationConfig,
  PreRegistration,
  User,
} from "@/domain/entities";

/**
 * 사이트 정보 설정 Repository 인터페이스
 */
export interface ISiteConfigRepository {
  getSiteConfig(): Promise<SiteConfig | null>;
}

/**
 * 통계 Repository 인터페이스
 */
export interface IStatsRepository {
  getStats(): Promise<Stats | null>;
}

/**
 * 공지사항 Repository 인터페이스
 */
export interface INoticeRepository {
  getNotices(limit?: number): Promise<Notice[]>;
  getNoticeById(id: string): Promise<Notice | null>;
  getPinnedNotices(): Promise<Notice[]>;
}

/**
 * FAQ Repository 인터페이스
 */
export interface IFAQRepository {
  getFAQs(): Promise<FAQ[]>;
  getFAQsByCategory(category: string): Promise<FAQ[]>;
}

/**
 * 모집 Repository 인터페이스
 */
export interface IRecruitmentRepository {
  getCurrentRecruitment(): Promise<Recruitment | null>;
  getRecruitmentByGeneration(generation: number): Promise<Recruitment | null>;
}

/**
 * 활동 Repository 인터페이스
 */
export interface IActivityRepository {
  getActivities(options?: {
    limit?: number;
    category?: string;
    startAfter?: string;
  }): Promise<Activity[]>;
  getActivityById(id: string): Promise<ActivityDetail | null>;
  getActivitiesByCategory(category: string): Promise<Activity[]>;
  getFeaturedActivities(): Promise<Activity[]>;
}

/**
 * 멤버 후기 Repository 인터페이스
 */
export interface ITestimonialRepository {
  getActiveTestimonials(limit?: number): Promise<Testimonial[]>;
}

/**
 * 사전등록 Repository 인터페이스
 */
export interface IPreRegistrationRepository {
  getConfigByGeneration(generation: number): Promise<PreRegistrationConfig | null>;
  submitPreRegistration(data: { generation: number; name: string; formData: Record<string, string> }): Promise<string>;
}

/**
 * 사용자 Repository 인터페이스
 */
export interface IUserRepository {
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, "createdAt" | "updatedAt">): Promise<User>;
  updateUser(email: string, data: Partial<Omit<User, "email" | "createdAt">>): Promise<void>;
  isAdmin(email: string): Promise<boolean>;
}
