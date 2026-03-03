# Testimonial (멤버 후기) Firestore 스키마

백오피스 관리자 페이지에서 멤버 후기를 등록할 때 사용하는 Firestore 데이터 구조입니다.

## Collection: `testimonials`

### 문서 구조

```typescript
{
  // 필수 필드
  category: string;       // 직무 카테고리 (예: "Back-End", "Front-End")
  content: string;        // 후기 내용
  name: string;           // 멤버 이름
  generation: number;     // 기수 (예: 4)
  order: number;          // 노출 순서 (1, 2, 3...)
  isActive: boolean;      // 활성화 여부

  // 선택 필드
  avatarPath?: string;    // 프로필 이미지 Storage 경로

  // 자동 생성
  createdAt: Timestamp;   // 생성일
  updatedAt: Timestamp;   // 수정일
}
```

### 직무 카테고리 예시

- `"Front-End"`
- `"Back-End"`
- `"Mobile App"`
- `"Full-Stack"`
- `"DevOps"`
- `"Data Engineer"`
- `"PM/PO"`
- `"Designer"`

## 예시 데이터

```json
{
  "category": "Back-End",
  "content": "그로스로그 덕분에 사이드 프로젝트 개발 역량을 많이 쌓을 수 있었습니다. 여러 분야의 개발자들과 협업하면서 시야가 넓어졌어요.",
  "name": "이민경",
  "generation": 3,
  "order": 1,
  "isActive": true,
  "avatarPath": "testimonials/avatar-1.jpg",
  "createdAt": "2024-12-01T00:00:00Z",
  "updatedAt": "2024-12-01T00:00:00Z"
}
```

## 백오피스 입력 필드

| 필드명 | 입력 유형 | 필수 | 설명 |
|--------|----------|------|------|
| 직무 | 드롭다운/텍스트 | ✅ | 직무 카테고리 |
| 후기 내용 | 텍스트에어리어 | ✅ | 후기 본문 |
| 이름 | 텍스트 | ✅ | 멤버 이름 |
| 기수 | 숫자 | ✅ | 몇 기인지 |
| 노출 순서 | 숫자 | ✅ | 1, 2, 3 순서 |
| 활성화 | 체크박스 | ✅ | 메인에 노출할지 |
| 프로필 사진 | 파일 업로드 | ❌ | 없으면 이니셜 표시 |

## Firebase Storage 경로 규칙

프로필 이미지는 다음 경로 규칙을 따릅니다:

```
testimonials/{filename}
```

예시:
- `testimonials/avatar-minkyung.jpg`
- `testimonials/avatar-yeseung.jpg`

## 쿼리 로직

메인 페이지에서는 다음 조건으로 3개만 가져옵니다:

```typescript
query(
  collection(db, "testimonials"),
  where("isActive", "==", true),
  orderBy("order", "asc"),
  limit(3)
)
```
