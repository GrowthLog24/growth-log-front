"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { LevelProgressDto } from "@/application/dtos/memberAchievement";

interface GrowthTreeProps {
  level: LevelProgressDto;
}

function getGrowthStage(level: number) {
  if (level <= 2) return { label: "새싹", stage: 1 };
  if (level <= 4) return { label: "어린 나무", stage: 2 };
  return { label: "성장한 나무", stage: 3 };
}

/** 레벨에 따라 새싹에서 나무로 성장하는 인터랙티브 3D 오브젝트입니다. */
export function GrowthTree({ level }: GrowthTreeProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<SVGSVGElement>(null);
  const stage = getGrowthStage(level.level);

  useEffect(() => {
    const scene = sceneRef.current;
    const object = objectRef.current;
    if (!scene || !object) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        object.querySelectorAll("[data-grow]"),
        { opacity: 0, scale: 0.45, transformOrigin: "center bottom" },
        { opacity: 1, scale: 1, duration: 0.9, stagger: 0.08, ease: "back.out(1.8)" }
      );
      gsap.to(object, { y: -8, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(object.querySelectorAll("[data-leaf]"), {
        rotation: 3,
        duration: 2.1,
        repeat: -1,
        yoyo: true,
        stagger: 0.12,
        transformOrigin: "center bottom",
        ease: "sine.inOut",
      });
    }, scene);

    const xTo = gsap.quickTo(object, "rotationY", { duration: 0.65, ease: "power3.out" });
    const yTo = gsap.quickTo(object, "rotationX", { duration: 0.65, ease: "power3.out" });
    const onPointerMove = (event: PointerEvent) => {
      const bounds = scene.getBoundingClientRect();
      xTo(((event.clientX - bounds.left) / bounds.width - 0.5) * 18);
      yTo(-((event.clientY - bounds.top) / bounds.height - 0.5) * 12);
    };
    const onPointerLeave = () => { xTo(0); yTo(0); };

    scene.addEventListener("pointermove", onPointerMove);
    scene.addEventListener("pointerleave", onPointerLeave);
    return () => {
      context.revert();
      scene.removeEventListener("pointermove", onPointerMove);
      scene.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [stage.stage]);

  return (
    <div ref={sceneRef} className="growth-tree-scene" aria-label={`레벨 ${level.level}, ${stage.label} 단계`}>
      <div className="growth-tree-glow" aria-hidden />
      <svg ref={objectRef} viewBox="0 0 320 360" className="growth-tree-object" role="img">
        <title>{stage.label} 성장 오브젝트</title>
        <defs>
          <radialGradient id="leafGreen" cx="35%" cy="25%">
            <stop offset="0" stopColor="#caffad" />
            <stop offset="0.45" stopColor="#58c94a" />
            <stop offset="1" stopColor="#147b32" />
          </radialGradient>
          <linearGradient id="trunkBrown" x1="0" x2="1">
            <stop stopColor="#5d321d" /><stop offset="0.45" stopColor="#b77a42" /><stop offset="1" stopColor="#3d2217" />
          </linearGradient>
          <radialGradient id="soil" cx="45%" cy="30%">
            <stop stopColor="#94714e" /><stop offset="1" stopColor="#24170f" />
          </radialGradient>
          <filter id="treeShadow"><feDropShadow dx="0" dy="12" stdDeviation="10" floodOpacity=".35" /></filter>
        </defs>

        <ellipse cx="160" cy="325" rx="104" ry="23" fill="#06140b" opacity=".55" />
        <ellipse data-grow cx="160" cy="305" rx="78" ry="28" fill="url(#soil)" filter="url(#treeShadow)" />
        <path data-grow d="M142 304 C149 254 147 211 158 161 C168 207 168 260 179 304Z" fill="url(#trunkBrown)" />

        {stage.stage >= 2 && (
          <g data-grow>
            <path d="M158 226 C125 202 110 184 96 158" fill="none" stroke="url(#trunkBrown)" strokeWidth="12" strokeLinecap="round" />
            <path d="M161 213 C192 190 207 168 218 144" fill="none" stroke="url(#trunkBrown)" strokeWidth="11" strokeLinecap="round" />
          </g>
        )}
        {stage.stage >= 3 && (
          <g data-grow>
            <path d="M155 185 C129 159 128 132 126 110" fill="none" stroke="url(#trunkBrown)" strokeWidth="10" strokeLinecap="round" />
            <path d="M163 178 C184 154 190 129 190 104" fill="none" stroke="url(#trunkBrown)" strokeWidth="9" strokeLinecap="round" />
          </g>
        )}

        <g data-grow data-leaf>
          <ellipse cx="132" cy="154" rx="42" ry="24" transform="rotate(28 132 154)" fill="url(#leafGreen)" />
          <ellipse cx="189" cy="145" rx="42" ry="24" transform="rotate(-28 189 145)" fill="url(#leafGreen)" />
        </g>
        {stage.stage >= 2 && (
          <g data-grow data-leaf>
            <circle cx="91" cy="142" r="37" fill="url(#leafGreen)" />
            <circle cx="225" cy="128" r="40" fill="url(#leafGreen)" />
            <circle cx="159" cy="112" r="45" fill="url(#leafGreen)" />
          </g>
        )}
        {stage.stage >= 3 && (
          <g data-grow data-leaf>
            <circle cx="113" cy="86" r="45" fill="url(#leafGreen)" />
            <circle cx="202" cy="76" r="48" fill="url(#leafGreen)" />
            <circle cx="157" cy="49" r="49" fill="url(#leafGreen)" />
          </g>
        )}
      </svg>
    </div>
  );
}
