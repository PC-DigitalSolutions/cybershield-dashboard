"use client";

import React from "react";

const ACCENT = "#00CFFF";
const TEXT = "#B0BEC5";
const ROYAL = "#2952CC";
const BABY = "#00CFFF";
const SILVER = "#B0BEC5";
const NEON = "#39FF14";

// El Guardián signs off with: "Strength. Vigilance. Intelligence. | CyberShield AI — El Guardián."
const SIG_RE = /\|\s*CyberShield AI/i;
const PILLAR_COLORS = [ROYAL, BABY, NEON];

function EagleGlyph({ size = 16, color = ROYAL }: { size?: number; color?: string }) {
  return (
    <span aria-hidden className="inline-block flex-shrink-0"
      style={{ filter: `drop-shadow(0 0 4px ${color}AA)` }}>
      <span className="block" style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: "url(/eagle.png)",
        maskImage: "url(/eagle.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }} />
    </span>
  );
}

function Signature({ line }: { line: string }) {
  const [pillarsPart, idPart = ""] = line.split("|");
  const pillars = pillarsPart
    .replace(/\.\s*$/, "")
    .split(/\.\s*/)
    .map(s => s.trim())
    .filter(Boolean);
  const identity = idPart.replace(/\.\s*$/, "").trim();

  return (
    <div className="mt-3 pt-2.5 flex items-center gap-1.5 text-[10px] font-black tracking-[0.16em]"
      style={{ borderTop: `1px solid ${ROYAL}33` }}>
      <EagleGlyph size={15} color={SILVER} />
      {pillars.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: `${SILVER}55` }}>•</span>}
          <span style={{
            color: PILLAR_COLORS[i] ?? ROYAL,
            textShadow: `0 0 10px ${(PILLAR_COLORS[i] ?? ROYAL)}66`,
          }}>{p.toUpperCase()}</span>
        </React.Fragment>
      ))}
      {identity && (
        <>
          <span className="mx-0.5" style={{ color: `${SILVER}40` }}>|</span>
          <span className="text-[9px] tracking-[0.22em] font-bold whitespace-nowrap"
            style={{ color: SILVER, textShadow: `0 0 8px ${SILVER}40` }}>
            {identity.toUpperCase()}
          </span>
        </>
      )}
    </div>
  );
}

// Renders El Guardián's markdown-style output (**bold**, *italic*, bullet
// and numbered lists) as styled JSX instead of raw asterisks.
function renderInline(text: string, key: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={`b${key}-${i++}`} className="font-bold" style={{ color: "#fff" }}>
          {tok.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <em key={`i${key}-${i++}`} className="italic" style={{ color: ACCENT }}>
          {tok.slice(1, -1)}
        </em>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function RichText({ text }: { text: string }) {
  const blocks = text.split("\n").map((line, idx) => {
    if (SIG_RE.test(line)) return <Signature key={idx} line={line} />;
    const item = line.match(/^(\s*)(\d+\.|[*\-•])\s+(.*)$/);
    if (item) {
      const depth = Math.min(Math.floor(item[1].length / 4), 3);
      const marker = /^\d/.test(item[2]) ? item[2] : "▸";
      return (
        <div key={idx} className="flex gap-2" style={{ paddingLeft: depth * 14 }}>
          <span className="flex-shrink-0 font-bold" style={{ color: ACCENT }}>{marker}</span>
          <span>{renderInline(item[3], idx)}</span>
        </div>
      );
    }
    if (line.trim() === "") return <div key={idx} className="h-2" />;
    return <p key={idx}>{renderInline(line, idx)}</p>;
  });

  return (
    <div className="text-[13px] leading-[1.7] space-y-1.5" style={{ color: TEXT }}>
      {blocks}
    </div>
  );
}
