export type AnalyticsEventName =
  | "cta_click"
  | "contact_click"
  | "generate_lead"
  | "faq_open"
  | "recruitment_action"
  | "select_content";

export type AnalyticsEventParams = Record<
  string,
  string | number | boolean
>;

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: AnalyticsEventName,
      params?: AnalyticsEventParams
    ) => void;
  }
}

/**
 * Google Analytics가 초기화된 브라우저에서만 이벤트를 전송한다.
 * 측정 ID가 없거나 서버에서 실행될 때는 아무 동작도 하지 않는다.
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams = {}
) {
  if (
    typeof window === "undefined" ||
    !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    typeof window.gtag !== "function"
  ) {
    return;
  }

  window.gtag("event", eventName, params);
}
