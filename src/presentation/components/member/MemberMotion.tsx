"use client";

import { useEffect, type ReactNode } from "react";

/** 회원 페이지의 스크롤 패럴랙스와 진입 모션을 한 곳에서 관리합니다. */
export function MemberMotion({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let frame = 0;
    const updateScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        root.style.setProperty("--member-scroll", `${window.scrollY}px`);
        frame = 0;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll("[data-member-reveal]").forEach((node) => observer.observe(node));
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateScroll);
      if (frame) window.cancelAnimationFrame(frame);
      root.style.removeProperty("--member-scroll");
    };
  }, []);

  return <div className="member-page">{children}</div>;
}
