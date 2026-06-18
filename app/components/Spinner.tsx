"use client";
export default function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <path d="M22 12a10 10 0 00-10-10" stroke="#00F5D4" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
