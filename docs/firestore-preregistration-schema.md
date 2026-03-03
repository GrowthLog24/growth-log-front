# Pre-Registration (사전등록) Firestore 스키마

사전등록 폼 설정과 제출 데이터를 관리하는 Firestore 데이터 구조입니다.

## 1. Collection: `preRegistrationConfig`

폼 필드 설정을 기수별로 관리합니다. 문서 ID는 기수 번호입니다.

### 문서 구조 (예: `preRegistrationConfig/6`)

```typescript
{
  generation: number;           // 대상 기수 (예: 6)
  title: string;                // 폼 제목 (예: "6기 사전등록")
  description?: string;         // 폼 설명
  fields: PreRegistrationField[]; // 폼 필드 목록
  isActive: boolean;            // 활성화 여부
  createdAt: Timestamp;         // 생성일
  updatedAt: Timestamp;         // 수정일
}
```

### PreRegistrationField 구조

```typescript
{
  id: string;                   // 필드 ID (예: "name", "email")
  type: "text" | "email" | "phone" | "select" | "textarea";
  label: string;                // 라벨 (예: "이름")
  placeholder?: string;         // 플레이스홀더
  required: boolean;            // 필수 여부
  options?: string[];           // select 타입일 경우 옵션 배열
  order: number;                // 표시 순서
}
```

### 예시 데이터

```json
{
  "generation": 6,
  "title": "6기 사전등록",
  "description": "6기 모집이 시작되면 가장 먼저 안내해 드립니다.",
  "isActive": true,
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "이름",
      "placeholder": "이름을 입력해주세요",
      "required": true,
      "order": 1
    },
    {
      "id": "email",
      "type": "email",
      "label": "이메일",
      "placeholder": "이메일을 입력해주세요",
      "required": true,
      "order": 2
    },
    {
      "id": "phone",
      "type": "phone",
      "label": "연락처",
      "placeholder": "010-0000-0000",
      "required": true,
      "order": 3
    },
    {
      "id": "job",
      "type": "select",
      "label": "직무",
      "required": true,
      "options": ["프론트엔드", "백엔드", "풀스택", "모바일", "DevOps", "PM/PO", "디자이너", "기타"],
      "order": 4
    },
    {
      "id": "motivation",
      "type": "textarea",
      "label": "관심 분야",
      "placeholder": "그로스로그에서 하고 싶은 활동을 알려주세요",
      "required": false,
      "order": 5
    }
  ],
  "createdAt": "2025-03-01T00:00:00Z",
  "updatedAt": "2025-03-01T00:00:00Z"
}
```

## 2. Collection: `preRegistrations`

제출된 사전등록 데이터를 저장합니다.

### 문서 구조

```typescript
{
  generation: number;                    // 대상 기수
  formData: Record<string, string>;      // 제출된 데이터 (필드ID: 값)
  submittedAt: Timestamp;                // 제출 시간
}
```

### 예시 데이터

```json
{
  "generation": 6,
  "formData": {
    "name": "홍길동",
    "email": "hong@example.com",
    "phone": "010-1234-5678",
    "job": "프론트엔드",
    "motivation": "다양한 개발자들과 네트워킹하고 싶습니다."
  },
  "submittedAt": "2025-03-02T10:30:00Z"
}
```

## 백오피스 관리 항목

### 폼 설정 관리

| 항목 | 설명 |
|------|------|
| 기수 | 사전등록 대상 기수 |
| 제목 | 폼 상단에 표시될 제목 |
| 설명 | 폼 상단에 표시될 설명 |
| 활성화 | 사전등록 폼 활성화 여부 |

### 필드 관리

| 항목 | 입력 유형 | 설명 |
|------|----------|------|
| 필드 ID | 텍스트 | 고유 식별자 (영문) |
| 타입 | 드롭다운 | text, email, phone, select, textarea |
| 라벨 | 텍스트 | 화면에 표시될 필드명 |
| 플레이스홀더 | 텍스트 | 입력 안내 문구 |
| 필수 여부 | 체크박스 | 필수 입력 여부 |
| 옵션 | 배열 | select 타입일 경우 선택 옵션 |
| 순서 | 숫자 | 표시 순서 |

### 제출 데이터 조회

백오피스에서 제출된 사전등록 데이터를 조회할 수 있습니다:

- 기수별 필터링
- 제출일 기준 정렬
- CSV 내보내기

## 동작 흐름

1. **모집 중 (OPEN)**: "{현재기수}기 지원하기" 버튼 표시
2. **모집 마감 (CLOSED)**: "{현재기수+1}기 사전등록하기" 버튼 표시
3. 사전등록 버튼 클릭 → 폼 다이얼로그 표시
4. 폼 제출 → `/api/pre-registration` API 호출
5. Firestore `preRegistrations` 컬렉션에 저장
6. 성공 메시지 표시

## 필드 타입별 검증

| 타입 | 검증 규칙 |
|------|----------|
| `text` | 필수인 경우 빈 값 체크 |
| `email` | 이메일 형식 검증 |
| `phone` | 숫자/하이픈/괄호만 허용 |
| `select` | 옵션 중 선택 필수 |
| `textarea` | 필수인 경우 빈 값 체크 |
