# 백오피스 관리 항목 정리

Growth Log 웹사이트의 백오피스(관리자 페이지)에서 관리해야 할 모든 항목을 정리한 문서입니다.

---

## 📋 목차

1. [사이트 정보 설정](#1-사이트-설정)
2. [모집 관리](#2-모집-관리)
3. [활동 기록](#3-활동-관리)
4. [멤버 후기](#4-멤버-후기)
5. [공지사항](#5-공지사항)
6. [FAQ](#6-faq)
7. [사전등록](#7-사전등록)
8. [통계](#8-통계)
9. [미디어 라이브러리](#9-미디어-라이브러리)

---

## 1. 사이트 정보 설정

**Firestore Collection**: `siteConfig/main`

### 관리 항목

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `currentGeneration` | number | 현재 모집 기수 | `5` |
| `navCtaText` | string | 네비게이션 CTA 버튼 텍스트 | `"5기 지원하기"` |
| `navCtaLink` | string | 네비게이션 CTA 링크 | `"/recruit"` |
| `chatLink` | string | 카카오톡 오픈채팅 링크 | `"http://pf.kakao.com/..."` |

### 백오피스 UI

- 단일 설정 페이지
- 각 필드별 입력 폼
- 저장 버튼

---

## 2. 모집 관리

**Firestore Collection**: `recruitments/{기수번호}`

### 관리 항목

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| `generation` | number | 기수 | ✅ |
| `status` | select | 모집 상태 (`OPEN` / `CLOSED`) | ✅ |
| `applyLink` | string | 지원 폼 링크 (Google Form 등) | ✅ |
| `deadlineAt` | datetime | 모집 마감일 | ✅ |
| `contactPhone` | string | 문의 전화번호 | ✅ |
| `contactEmail` | string | 문의 이메일 | ✅ |
| `introMd` | markdown | 모집 소개 내용 | ✅ |
| `feeAmount` | number | 회비 금액 | ✅ |
| `feeDescriptionMd` | markdown | 회비 설명 | ✅ |
| `bankAccountText` | string | 입금 계좌 정보 | ✅ |
| `regularMeetingsMd` | markdown | 정기 모임 설명 | ✅ |

### OT 일정 (SubCollection)

**Path**: `recruitments/{기수}/otSchedules/{id}`

| 필드 | 타입 | 설명 |
|------|------|------|
| `round` | number | 회차 (1차, 2차...) |
| `dateAt` | datetime | 일시 |
| `timeText` | string | 시간 텍스트 |
| `locationText` | string | 장소 |
| `note` | string | 비고 |

### 백오피스 UI

- 기수별 목록 페이지
- 모집 상세/수정 페이지
- OT 일정 추가/수정/삭제
- **모집 시작/마감 토글 버튼**

---

## 3. 활동 기록

**Firestore Collection**: `activities/{activityId}`

### 관리 항목

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| `title` | string | 활동 제목 | ✅ |
| `category` | select | 카테고리 | ✅ |
| `summary` | string | 요약 설명 | ✅ |
| `tags` | array | 해시태그 | ✅ |
| `generation` | number | 기수 | ✅ |
| `eventDateAt` | datetime | 활동 날짜 | ✅ |
| `thumbnail` | file | 썸네일 이미지 | ✅ |
| `externalUrl` | string | 외부 링크 (블로그/인스타) | ❌ |
| `externalPlatform` | select | 플랫폼 유형 | ❌ |
| `isFeatured` | boolean | 메인 페이지 노출 | ✅ |

### 카테고리 옵션

- 프로젝트
- 학사 스터디
- 성장일지
- 전문가 특강
- 그로스톡
- 클럽 활동

### 플랫폼 옵션

- `blog` - 블로그
- `instagram` - 인스타그램
- `youtube` - 유튜브
- `notion` - 노션
- `other` - 기타

### 백오피스 UI

- 활동 목록 페이지 (필터: 카테고리, 기수)
- 활동 등록/수정 페이지
- 썸네일 이미지 업로드
- 메인 노출 토글

---

## 4. 멤버 후기

**Firestore Collection**: `testimonials/{testimonialId}`

### 관리 항목

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| `name` | string | 멤버 이름 | ✅ |
| `category` | string | 직무 (Back-End 등) | ✅ |
| `content` | textarea | 후기 내용 | ✅ |
| `generation` | number | 기수 | ✅ |
| `avatarPath` | file | 프로필 이미지 | ❌ |
| `order` | number | 노출 순서 (1, 2, 3) | ✅ |
| `isActive` | boolean | 활성화 여부 | ✅ |

### 백오피스 UI

- 후기 목록 페이지
- 후기 등록/수정 페이지
- 순서 드래그앤드롭
- 활성화/비활성화 토글
- **메인에는 활성화된 후기 중 order 순으로 3개만 표시**

---

## 5. 공지사항

**Firestore Collection**: `notices/{noticeId}`

### 관리 항목

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| `title` | string | 제목 | ✅ |
| `summary` | string | 요약 | ✅ |
| `contentMd` | markdown | 본문 (마크다운) | ✅ |
| `isPinned` | boolean | 상단 고정 | ✅ |
| `publishedAt` | datetime | 게시일 | ✅ |

### 백오피스 UI

- 공지사항 목록 페이지
- 공지사항 등록/수정 페이지
- 마크다운 에디터
- 상단 고정 토글

---

## 6. FAQ

**Firestore Collection**: `faqs/{faqId}`

### 관리 항목

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| `category` | select | 카테고리 | ✅ |
| `question` | string | 질문 | ✅ |
| `answerMd` | markdown | 답변 (마크다운) | ✅ |
| `order` | number | 노출 순서 | ✅ |
| `isActive` | boolean | 활성화 여부 | ✅ |

### 카테고리 옵션

- 가입 및 등록
- 회비 및 환불
- 활동 및 참여
- 프로젝트 및 스터디
- 그로스로그란

### 백오피스 UI

- FAQ 목록 페이지 (카테고리별 탭)
- FAQ 등록/수정 페이지
- 순서 드래그앤드롭
- 활성화/비활성화 토글

---

## 7. 사전등록

### 7-1. 폼 설정

**Firestore Collection**: `preRegistrationConfig/{기수번호}`

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| `generation` | number | 대상 기수 | ✅ |
| `title` | string | 폼 제목 | ✅ |
| `description` | string | 폼 설명 | ❌ |
| `fields` | array | 폼 필드 목록 | ✅ |
| `isActive` | boolean | 활성화 여부 | ✅ |

### 폼 필드 설정

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 필드 ID (영문) |
| `type` | select | 타입 (text/email/phone/select/textarea) |
| `label` | string | 라벨 |
| `placeholder` | string | 플레이스홀더 |
| `required` | boolean | 필수 여부 |
| `options` | array | select 옵션 (select 타입만) |
| `order` | number | 순서 |

### 7-2. 제출 데이터 조회

**Firestore Collection**: `preRegistrations/{id}`

| 필드 | 타입 | 설명 |
|------|------|------|
| `generation` | number | 대상 기수 |
| `formData` | object | 제출된 데이터 |
| `submittedAt` | datetime | 제출 시간 |

### 백오피스 UI

- 폼 설정 페이지 (기수별)
- 필드 추가/수정/삭제/순서변경
- 제출 데이터 목록 페이지
- **CSV 내보내기 기능**
- 기수별 필터링

---

## 8. 통계

**Firestore Collection**: `stats/main`

### 관리 항목

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `operatingYears` | number | 운영 연차 | `3` |
| `activeMembers` | number | 활동 중인 멤버 수 | `45` |
| `projectsCount` | number | 진행된 프로젝트 수 | `28` |
| `generationsCount` | number | 기수 | `5` |
| `totalMembers` | number | 누적 멤버 수 | `180` |
| `growthPostsCount` | number | 성장일지 수 | `320` |

### 백오피스 UI

- 단일 통계 설정 페이지
- 각 수치 입력 필드

---

## 9. 미디어 라이브러리

**Firestore Collection**: `media/{mediaId}`
**Firebase Storage**: 실제 파일 저장

### 관리 항목

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | select | 타입 (image/file) |
| `storagePath` | string | Storage 경로 |
| `url` | string | 다운로드 URL |
| `width` | number | 이미지 너비 |
| `height` | number | 이미지 높이 |
| `ref` | object | 참조 정보 (컬렉션, 문서ID) |

### 백오피스 UI

- 미디어 갤러리 뷰
- 파일 업로드 (드래그앤드롭)
- 사용처 확인
- 미사용 파일 정리

---

## 📊 대시보드 요약

백오피스 메인 대시보드에 표시할 정보:

| 항목 | 설명 |
|------|------|
| 현재 모집 상태 | OPEN/CLOSED + 기수 |
| 사전등록 수 | 다음 기수 사전등록 인원 |
| 총 활동 수 | 등록된 활동 개수 |
| 메인 노출 활동 | Featured 활동 개수 |
| 총 멤버 후기 | 등록된 후기 개수 (활성/비활성) |
| 공지사항 | 최근 공지 + 고정 공지 |

---

## 🔐 권한 관리 (향후 확장)

| 역할 | 권한 |
|------|------|
| 슈퍼관리자 | 모든 권한 |
| 운영진 | 모집, 활동, 공지 관리 |
| 에디터 | 활동, 공지 작성만 |

---

## 📁 Firebase Storage 구조

```
/common/
  ├── hero-bg.mp4
  ├── team-photo.webp
  ├── recruit-photo.webp
  └── og-image.jpg

/activities/{year}/{activityId}/
  ├── thumb.jpg
  └── content/
      └── {filename}

/testimonials/
  └── avatar-{name}.jpg
```

---

## ✅ 체크리스트

### 모집 시작 시
- [ ] `siteConfig.currentGeneration` 업데이트
- [ ] `recruitments/{기수}` 문서 생성
- [ ] `status`를 `OPEN`으로 설정
- [ ] `applyLink` 설정
- [ ] `deadlineAt` 설정

### 모집 마감 시
- [ ] `recruitments/{기수}.status`를 `CLOSED`로 변경
- [ ] `preRegistrationConfig/{다음기수}` 생성 (선택)

### 새 활동 등록 시
- [ ] 썸네일 이미지 업로드
- [ ] 외부 URL 입력 (블로그/인스타)
- [ ] 메인 노출 여부 설정
- [ ] 카테고리, 태그 입력
