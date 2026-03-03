# Activity Firestore 스키마

백오피스 관리자 페이지에서 활동을 등록할 때 사용하는 Firestore 데이터 구조입니다.

## Collection: `activities`

### 문서 구조

```typescript
{
  // 필수 필드
  title: string;              // 제목 (예: "4기 프로젝트 발표회")
  category: ActivityCategory; // 카테고리 (아래 참조)
  summary: string;            // 요약 설명
  tags: string[];             // 해시태그 배열 (예: ["React", "Firebase"])
  generation: number;         // 기수 (예: 4)

  // 썸네일
  thumbnail: {
    storagePath: string;      // Firebase Storage 경로 (예: "activities/2024/p1/thumb.jpg")
    url?: string;             // 외부 URL (Storage 대신 외부 이미지 사용 시)
  };

  // 날짜
  eventDateAt: Timestamp;     // 활동 날짜
  publishedAt: Timestamp;     // 게시 날짜

  // 외부 링크 (선택)
  externalUrl?: string;       // 외부 URL (예: "https://blog.naver.com/growth-log/...")
  externalPlatform?: string;  // 플랫폼 유형: "blog" | "instagram" | "youtube" | "notion" | "other"

  // 메타
  isFeatured: boolean;        // 메인 페이지 노출 여부
  createdAt: Timestamp;       // 생성일
  updatedAt: Timestamp;       // 수정일
}
```

### ActivityCategory 값

- `"프로젝트"`
- `"학사 스터디"`
- `"성장일지"`
- `"전문가 특강"`
- `"그로스톡"`
- `"클럽 활동"`

### ExternalPlatform 값

- `"blog"` - 네이버 블로그, 티스토리 등
- `"instagram"` - 인스타그램 포스트
- `"youtube"` - 유튜브 영상
- `"notion"` - 노션 페이지
- `"other"` - 기타

## 예시 데이터

### 블로그 링크 활동

```json
{
  "title": "4기 프로젝트 발표회",
  "category": "프로젝트",
  "summary": "React + Firebase로 커뮤니티 플랫폼 구축",
  "tags": ["React", "Firebase", "TypeScript"],
  "generation": 4,
  "thumbnail": {
    "storagePath": "activities/2024/p1/thumb.jpg"
  },
  "eventDateAt": "2024-12-15T10:00:00Z",
  "publishedAt": "2024-12-16T09:00:00Z",
  "externalUrl": "https://blog.naver.com/growth-log/project-4th",
  "externalPlatform": "blog",
  "isFeatured": true,
  "createdAt": "2024-12-16T09:00:00Z",
  "updatedAt": "2024-12-16T09:00:00Z"
}
```

### 인스타그램 링크 활동

```json
{
  "title": "2025년 1월 그로스톡",
  "category": "그로스톡",
  "summary": "멤버들의 자유 발표와 네트워킹",
  "tags": ["네트워킹", "발표"],
  "generation": 5,
  "thumbnail": {
    "storagePath": "activities/2025/gt1/thumb.jpg"
  },
  "eventDateAt": "2025-01-18T14:00:00Z",
  "publishedAt": "2025-01-19T10:00:00Z",
  "externalUrl": "https://www.instagram.com/p/ABC123/",
  "externalPlatform": "instagram",
  "isFeatured": true,
  "createdAt": "2025-01-19T10:00:00Z",
  "updatedAt": "2025-01-19T10:00:00Z"
}
```

## 백오피스 입력 필드

관리자 페이지에서 필요한 입력 필드:

| 필드명 | 입력 유형 | 필수 | 설명 |
|--------|----------|------|------|
| 제목 | 텍스트 | ✅ | 활동 제목 |
| 카테고리 | 드롭다운 | ✅ | 6개 카테고리 중 선택 |
| 요약 | 텍스트 | ✅ | 짧은 설명 |
| 기수 | 숫자 | ✅ | 몇 기 활동인지 |
| 해시태그 | 태그 입력 | ✅ | 쉼표로 구분 |
| 활동 날짜 | 날짜 선택 | ✅ | 활동이 진행된 날짜 |
| 썸네일 | 파일 업로드 | ✅ | 이미지 파일 |
| 외부 URL | URL 입력 | ❌ | 블로그/인스타 링크 |
| 플랫폼 | 드롭다운 | ❌ | blog, instagram 등 |
| 메인 노출 | 체크박스 | ❌ | 메인 페이지 노출 여부 |

## Firebase Storage 경로 규칙

썸네일 이미지는 다음 경로 규칙을 따릅니다:

```
activities/{year}/{activityId}/thumb.jpg
```

예시:
- `activities/2024/p1/thumb.jpg`
- `activities/2025/gt1/thumb.jpg`
