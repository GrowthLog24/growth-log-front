"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
  suffixClassName?: string;
}

/**
 * 숫자 카운트업 애니메이션 컴포넌트
 * 화면에 보일 때 0에서 목표 숫자까지 올라가는 애니메이션
 */
export function AnimatedCounter({
  value,
  suffix = "",
  duration = 1500,
  className = "",
  suffixClassName = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateValue(0, value, duration);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  const animateValue = (start: number, end: number, duration: number) => {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo for smooth deceleration
      const easeProgress = 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.floor(start + (end - start) * easeProgress);

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <span ref={ref} className={`inline-flex items-baseline ${className}`}>
      <span className="inline-block overflow-hidden">
        <span
          className="inline-block transition-transform duration-300"
          style={{
            transform: hasAnimated ? "translateY(0)" : "translateY(100%)",
          }}
        >
          {count}
        </span>
      </span>
      {suffix && <span className={suffixClassName}>{suffix}</span>}
    </span>
  );
}
