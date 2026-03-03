# Growth Log PRD – Firebase 기반 데이터/리소스 관리 부록

본 문서는 Growth Log 웹사이트가 **Firebase(Cloud Firestore + Cloud Storage 중심)** 를 사용해
공지/FAQ/활동/모집정보/통계/이미지 리소스를 관리하는 구조를 정의한다.

- 권한(Role/Permission) 설계는 제외한다.
- 게시글 작성 UI는 별도 백오피스에서 처리한다.
- 본 사이트(프론트)는 읽기/노출 중심이다.

---

## 1. Firebase 사용 범위

### 1.1 Cloud Firestore
- 사이트에 노출되는 모든 콘텐츠의 **정규 데이터 저장소**
- 공지, FAQ, 활동(프로젝트/특강/성장일지 등), 모집 정보, 통계, 설정값 등

### 1.2 Cloud Storage
- 이미지/썸네일/첨부파일 등 **정적 리소스 저장소**
- Firestore 문서에는 Storage 경로 또는 다운로드 URL을 저장

### 1.3 Firebase Hosting
- 정적 웹 호스팅(Next.js/React/Vite 등)
- (선택) SSR 필요 시 Firebase Functions/Cloud Run 연계

### 1.4 Firebase Authentication (선택)
- 백오피스(관리자/운영진) 로그인에 사용 가능
- 본 PRD에서는 권한을 제외하므로 “사용 가능” 수준만 명시

### 1.5 Cloud Functions (선택)
- 업로드 후 썸네일 생성, 이미지 리사이즈
- 문서 작성/수정 시 검색 인덱스 업데이트
- 통계 집계(조회수/카운트) 배치 처리

---

## 2. 콘텐츠 운영 원칙 (프론트 기준)

- 프론트는 Firestore에서 문서를 읽어 렌더링한다.
- 본문은 Markdown(또는 MDX) 문자열로 저장하고, 프론트에서 렌더링한다.
- 목록 화면 성능을 위해 **리스트 필드(요약/썸네일/태그/날짜)** 와 **본문(content)** 을 분리할 수 있다.
    - (권장) `activities`는 요약만 두고, 본문은 `activities/{id}/body/main` 서브컬렉션 또는 `activityBodies`로 분리.

---

## 3. Firestore 컬렉션 설계 (권장)

> 아래 스키마는 “읽기 중심 웹사이트 + 별도 백오피스 작성”에 최적화한 형태

### 3.1 `siteConfig/{docId}` (단일 문서 추천: `siteConfig/main`)
사이트 전역 설정/표기값

**필드 예시**
- `currentGeneration`: number (예: 5)
- `navCtaText`: string (예: "5기 지원하기")
- `navCtaLink`: string (예: "/recruit")
- `chatLink`: string (외부 채널 URL)
- `updatedAt`: timestamp

---

### 3.2 `stats/{docId}` (단일 문서 추천: `stats/main`)
About 페이지 통계 숫자

**필드**
- `operatingYears`: number
- `activeMembers`: number
- `projectsCount`: number
- `generationsCount`: number
- `totalMembers`: number
- `growthPostsCount`: number
- `updatedAt`: timestamp

---

### 3.3 `notices/{noticeId}`
Support > 공지사항

**필드**
- `title`: string
- `summary`: string (목록용 한 줄)
- `contentMd`: string (또는 본문 분리)
- `isPinned`: boolean
- `publishedAt`: timestamp
- `createdAt`: timestamp
- `updatedAt`: timestamp

**인덱싱/쿼리**
- 핀 고정: `isPinned desc, publishedAt desc`
- Load more: `publishedAt` 기반 pagination

---

### 3.4 `faqs/{faqId}`
Support > FAQ

**필드**
- `category`: string (예: "가입 및 등록")
- `question`: string
- `answerMd`: string
- `order`: number (카테고리 내 정렬)
- `isActive`: boolean
- `updatedAt`: timestamp

**쿼리**
- `category == ? AND isActive == true ORDER BY order asc`

---

### 3.5 `recruitments/{generationId}` (예: `recruitments/5`)
Recruit 페이지 핵심 데이터(기수별)

**필드**
- `generation`: number (5)
- `status`: string ("OPEN" | "CLOSED")
- `applyLink`: string
- `deadlineAt`: timestamp
- `contactPhone`: string
- `contactEmail`: string
- `introMd`: string (모집 소개 상단 텍스트)
- `feeAmount`: number
- `feeDescriptionMd`: string
- `bankAccountText`: string
- `regularMeetingsMd`: string
- `updatedAt`: timestamp

**서브컬렉션**
- `recruitments/{generationId}/otSchedules/{otId}`
    - `round`: number (1,2,3)
    - `dateAt`: timestamp
    - `timeText`: string ("16:00")
    - `locationText`: string ("공덕역")
    - `note`: string

---

### 3.6 `activities/{activityId}`
Activity 페이지 전체 카드/상세의 통합 원천

**필드 (목록/필터용)**
- `category`: string
    - 예: "프로젝트" | "학사 스터디" | "성장일지" | "전문가 특강" | "그로스톡" | "클럽 활동"
- `title`: string
- `summary`: string
- `thumbnail`: object
    - `storagePath`: string (예: `activities/2026/xxx/thumb.jpg`)
    - `url`: string (선택: CDN/다운로드URL 캐싱)
- `tags`: string[] (예: ["백엔드", "프론트엔드"])
- `generation`: number (예: 4,5)
- `eventDateAt`: timestamp (행사/촬영 기준 날짜)
- `publishedAt`: timestamp
- `isFeatured`: boolean
- `createdAt`, `updatedAt`: timestamp

**본문 저장 방식(택1)**
- A안: `contentMd` 필드를 activities 문서에 직접 저장
- B안(권장): `activities/{id}/body/main` 문서에 저장
    - `contentMd`: string
    - `updatedAt`: timestamp

**쿼리**
- 목록: `publishedAt desc` pagination
- 카테고리: `category == ? ORDER BY publishedAt desc`
- 태그: `tags array-contains ? ORDER BY publishedAt desc`

---

### 3.7 (선택) `media/{mediaId}`
이미지/리소스 라이브러리(백오피스 편의)

**필드**
- `type`: string ("image" | "file")
- `storagePath`: string
- `url`: string
- `width`, `height`: number
- `createdAt`: timestamp
- `ref`: object (어떤 콘텐츠에서 쓰는지)

---

## 4. Storage 경로 규칙 (권장)

- 공지 이미지: `notices/{noticeId}/...`
- 활동 이미지: `activities/{year}/{activityId}/...`
- 썸네일: `activities/{year}/{activityId}/thumb.jpg`
- 장소/지도 리소스: `locations/...`
- 기타 공용: `common/...`

**권장 옵션**
- 업로드 후 Cloud Function으로
    - 썸네일 자동 생성(예: 320px, 640px)
    - webp 변환
    - 메타데이터(width/height) Firestore 기록

---

## 5. 페이지별 데이터 로딩 매핑

### 5.1 Main(/)
- `siteConfig/main` (CTA/채널 링크)
- `activities` 최신 9개 (`publishedAt desc limit 9`)
- (선택) `activities where isFeatured == true`
- (선택) `stats/main` 미리보기 일부

### 5.2 About us
- `stats/main`
- (선택) `siteConfig/main` 내 로드맵 데이터 또는 별도 컬렉션 `roadmaps`

### 5.3 Activity
- `activities` 목록 + 필터
- 상세: `activities/{id}` + (선택) `activities/{id}/body/main`

### 5.4 Recruit
- `recruitments/{currentGeneration}` (siteConfig의 currentGeneration 사용)
- `recruitments/{gen}/otSchedules` (round asc)

### 5.5 Support
- 공지 목록: `notices` (pinned 우선)
- FAQ: `faqs` (category+order)
- 찾아오시는 길: (선택) `siteConfig/main` 또는 `locations/main`

---

## 6. 성능/캐싱 요구사항

- 목록은 pagination 사용 (무한 스크롤 또는 Load more)
- 썸네일은 `srcset`(여러 사이즈) 또는 webp 우선
- Firestore 읽기 비용 최적화를 위해:
    - 본문 분리(B안) 고려
    - `summary` 필드 필수
    - `thumbnail.url` 캐싱(선택)

---

## 7. 운영(백오피스) 연동 포인트

- 백오피스는 Firestore/Storage에 CRUD
- 프론트는 읽기 전용
- 게시글 작성 시:
    1) 이미지 Storage 업로드
    2) Firestore 문서 생성/수정
    3) (선택) Function으로 썸네일/리사이즈/검색 인덱싱

---

## 8. 추가 확장 (선택)

- 조회수: `activities/{id}/metrics` 문서에 집계
- 검색: Algolia/Meilisearch 연동 또는 Firestore prefix-search 제한적 구현
- 다국어: `contentMd_ko`, `contentMd_en` 또는 `i18n` 구조

---

# End