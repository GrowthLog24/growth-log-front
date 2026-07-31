"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = [
  "section:not([data-motion-skip]) h2",
  "section:not([data-motion-skip]) h3",
  "section:not([data-motion-skip]) p",
  "section:not([data-motion-skip]) article",
  "section:not([data-motion-skip]) dl",
  "section:not([data-motion-skip]) [data-motion-block]",
].join(",");

const DIRECTIONS = ["up", "left", "right", "scale"] as const;

export function AboutViewportMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-about-motion-page]");
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    elements.forEach((element, index) => {
      const isHeading = element.matches("h2, h3");
      const isParagraph = element.matches("p");
      const direction = isHeading
        ? index % 2 === 0
          ? "left"
          : "right"
        : isParagraph
          ? "up"
          : DIRECTIONS[index % DIRECTIONS.length];

      element.dataset.reveal = direction;
      element.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
    });

    root.classList.add("viewport-motion-ready");

    if (reducedMotion) {
      elements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: [0.6],
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
