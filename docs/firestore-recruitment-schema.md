# Recruitment (모집) Firestore 스키마

모집 기수와 상태를 관리하는 Firestore 데이터 구조입니다.

## 1. Collection: `siteConfig`

사이트 전역 설정을 관리합니다. 현재 몇 기를 모집 중인지 설정합니다.

### 문서: `main`

```typescript
{
  currentGeneration: number;  // 현재 모집 중인 기수 (예: 5)
  navCtaText: string;         // 네비게이션 CTA 버튼 텍스트
  navCtaLink: string;         // 네비게이션 CTA 링크
  chatLink: string;           // 오픈채팅 링크
  updatedAt: Timestamp;       // 수정일
}
```

### 예시 데이터

```json
{
  "currentGeneration": 5,
  "navCtaText": "5기 지원하기",
  "navCtaLink": "/recruit",
  "chatLink": "https://open.kakao.com/...",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

## 2. Collection: `recruitments`

기수별 모집 정보를 관리합니다. 문서 ID는 기수 번호입니다.

### 문서 구조 (예: `recruitments/5`)

```typescript
{
  generation: number;           // 기수 (예: 5)
  status: "OPEN" | "CLOSED";    // 모집 상태
  applyLink: string;            // 지원 폼 링크
  deadlineAt: Timestamp;        // 모집 마감일
  contactPhone: string;         // 문의 전화번호
  contactEmail: string;         // 문의 이메일
  introMd: string;              // 소개 마크다운
  feeAmount: number;            // 회비 금액
  feeDescriptionMd: string;     // 회비 설명 마크다운
  bankAccountText: string;      // 입금 계좌 정보
  regularMeetingsMd: string;    // 정기 모임 설명
  updatedAt: Timestamp;         // 수정일
}
```

### 모집 상태 값

| 값 | 설명 | 버튼 표시 |
|---|---|---|
| `"OPEN"` | 모집 중 | "5기 지원하기" (활성화) |
| `"CLOSED"` | 모집 마감 | "5기 모집 마감" (비활성화) |

### 예시 데이터

```json
{
  "generation": 5,
  "status": "OPEN",
  "applyLink": "https://forms.google.com/...",
  "deadlineAt": "2025-02-28T23:59:59Z",
  "contactPhone": "010-1234-5678",
  "contactEmail": "growth.log@gmail.com",
  "introMd": "5기 멤버를 모집합니다...",
  "feeAmount": 100000,
  "feeDescriptionMd": "활동비 포함...",
  "bankAccountText": "카카오뱅크 3333-00-0000000 홍길동",
  "regularMeetingsMd": "매주 토요일 오후 2시...",
  "updatedAt": "2025-01-15T00:00:00Z"
}
```

## 백오피스에서 관리할 항목

### 필수 설정

| 항목 | 컬렉션/문서 | 필드 |
|------|------------|------|
| 현재 모집 기수 | `siteConfig/main` | `currentGeneration` |
| 모집 상태 | `recruitments/{기수}` | `status` |

### 모집 시작 시 체크리스트

1. `siteConfig/main.currentGeneration`을 새 기수로 업데이트
2. `recruitments/{새기수}` 문서 생성
3. `status`를 `"OPEN"`으로 설정
4. `deadlineAt`에 마감일 설정

### 모집 마감 시

1. `recruitments/{기수}.status`를 `"CLOSED"`로 변경

## 코드에서의 사용

```typescript
// HeroSection에서 사용
const recruitment = await recruitmentRepository.getCurrentRecruitment();

// generation: 5
// status: "OPEN" -> 버튼 활성화, "5기 지원하기"
// status: "CLOSED" -> 버튼 비활성화, "5기 모집 마감"
```
