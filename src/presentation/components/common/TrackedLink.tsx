"use client";

import Link from "next/link";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type MouseEventHandler,
} from "react";
import {
  trackEvent,
  type AnalyticsEventName,
  type AnalyticsEventParams,
} from "@/shared/utils/analytics";

type TrackedLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "onClick"
> & {
  eventName: AnalyticsEventName;
  eventParams?: AnalyticsEventParams;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  function TrackedLink(
    { eventName, eventParams, onClick, ...linkProps },
    ref
  ) {
    const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
      trackEvent(eventName, eventParams);
      onClick?.(event);
    };

    return <Link ref={ref} onClick={handleClick} {...linkProps} />;
  }
);

TrackedLink.displayName = "TrackedLink";
