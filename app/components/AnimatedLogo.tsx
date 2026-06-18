"use client";

import { useRef, useEffect } from "react";

export default function AnimatedLogo({ size = 140 }: { size?: number }) {
  const wrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `translate3d(${x * 6}px, ${y * 4}px, 0) rotateX(${y * 3}deg) rotateY(${x * 6}deg)`;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={wrap}
      className="logo-wrap relative"
      style={{ width: `${size}px`, height: `${size}px`, transition: "transform 160ms ease-out" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="circuit-pulse rounded-full" />
      </div>

      <img
        src="/cbsd_logo.png"
        alt="CyberShield Emblem"
        className="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,245,212,0.08)]"
      />

      <div className="absolute inset-0 rounded-full ring-neon pointer-events-none z-20" />
    </div>
  );
}
