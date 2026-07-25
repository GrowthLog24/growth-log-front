/**
 * 지원 경로 식별자
 * - cs: 방송대 컴퓨터과학과 학우
 * - other: 방송대 그 외 학과 학우
 */
export type ApplyTrackId = "cs" | "other";

/**
 * 방송대 그 외 학과 지원서(구글폼) 기본 링크
 *
 * 어드민 > 모집/사전등록 신청의 `recruitmentFormLinkOther` 값이 비어 있을 때 사용하는 폴백입니다.
 * 기수가 바뀌면 어드민에서 링크를 교체하세요. 어드민 값이 항상 이 상수보다 우선합니다.
 */
export const DEFAULT_KNOU_OTHER_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSfGjnCwZQTam_luer-2oGX3njm3nBcv4yIs74dh8_XtQBva4g/viewform";
