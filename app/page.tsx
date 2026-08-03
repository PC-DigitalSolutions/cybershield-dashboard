"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, Home, Crosshair, ChevronRight, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RichText from "./components/RichText";
import { MISSIONS, type Mission } from "./missions";
import { VIP_EVENTS, CONCERT_SCAM_META, type VipEvent } from "./events";

// Set NEXT_PUBLIC_API_BASE in your host (e.g. Vercel) to the deployed backend URL.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// ── THEME ────────────────────────────────────────────────
const T = {
  royalBlue:  "#1E3A8A",
  royalLight: "#2952CC",
  babyBlue:   "#00CFFF",
  silver:     "#B0BEC5",
  silverDim:  "#546E7A",
  neonGreen:  "#39FF14",
  bg:         "#040D1A",
  panel:      "#070F1F",
  panelBorder:"#1E3A8A",
};

const GOLD = "#F2C14E";

// Beta tester feedback form (Google Forms — paste the LIVE/published URL).
const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdsiVx3IB8T_g4vcpxHh-tdnTpXdZkM49xvDV7K_Z0jMnn9mg/viewform";

type AgentReport = { gate: string; agent: string; response: string };

type ApiTeam = { name: string; code: string; crest: string };
type ApiLiveMatch = {
  home: ApiTeam; away: ApiTeam;
  score: { home: number | null; away: number | null };
  status: string; minute: number | null;
  stage: string; group: string; venue: string; utcDate: string | null;
};
type ThreatAssessment = {
  level: "SEVERE" | "HIGH" | "ELEVATED" | "GUARDED" | "LOW";
  score: number; gate: string; agent: string; feed_hits: number;
};
type ApiUpcomingMatch = {
  home: ApiTeam; away: ApiTeam;
  stage: string; group: string; venue: string; utcDate: string | null;
  threat?: ThreatAssessment;
};
type StandingRow = {
  position: number; team: ApiTeam;
  played: number; won: number; draw: number; lost: number; points: number; gd: number;
};
type StandingGroup = { group: string; table: StandingRow[] };
type ApiResult = {
  home: ApiTeam; away: ApiTeam;
  score: { home: number | null; away: number | null };
  winner: string | null; stage: string; group: string; utcDate: string | null;
};
type ApiScorer = { name: string; team: string; crest: string; goals: number };
type MatchFeed = {
  source: string;
  live?: ApiLiveMatch[]; upcoming?: ApiUpcomingMatch[];
  results?: ApiResult[]; scorers?: ApiScorer[];
  standings?: StandingGroup[];
};

const LEVEL_COLOR: Record<string, string> = {
  SEVERE:   "#FF3B3B",
  HIGH:     "#FF8C42",
  ELEVATED: "#F2C14E",
  GUARDED:  "#00CFFF",
  LOW:      "#39FF14",
};

type LiveThreat = {
  id: string;
  title: string;
  link: string;
  source: string;
  published: string;
  kind: "threat" | "intel";
  gates: string[];
  primary_gate: string | null;
  agent: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  recommendation: string;
  ts: number;
};
type ThreatFeed = {
  status: string;
  source: string;
  total_seen: number;
  total_flagged: number;
  active_threats: number;
  active_intel: number;
  threats: LiveThreat[];
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#FF3B3B",
  HIGH:     "#FF8C42",
  MEDIUM:   "#F2C14E",
  INFO:     "#00CFFF",
};

type IntelItem = { title: string; link: string; source: string; published: string; kind: "ai" | "cyber" };
type IntelFeed = { status: string; count: number; items: IntelItem[] };

type GoalieTurn = { role: "user" | "model"; text: string; matches?: number; file?: string };
type Story = { id: number; created: number; story: string; scam_type: string; language: string };
type StoryFeed = {
  stories: Story[];
  total: number;
  this_week: number;
  scam_types: string[];
  by_type: Record<string, number>;
};

const SCAM_TYPE_META: Record<string, { icon: string; label: string }> = {
  romance:       { icon: "💔", label: "Romance" },
  dating:        { icon: "💘", label: "Dating app" },
  sugar:         { icon: "💸", label: "Sugar daddy/momma" },
  sextortion:    { icon: "🔒", label: "Sextortion" },
  tickets:       { icon: "🎫", label: "Tickets" },
  phishing:      { icon: "🔗", label: "Phishing" },
  smishing:      { icon: "📱", label: "Smishing" },
  impersonation: { icon: "🎭", label: "Impersonation" },
  crypto:        { icon: "🪙", label: "Crypto" },
  marketplace:   { icon: "🛒", label: "Marketplace" },
  jobs:          { icon: "💼", label: "Job offer" },
  merch:         { icon: "👕", label: "Merch" },
  travel:        { icon: "✈️", label: "Travel" },
  other:         { icon: "⚠️", label: "Other" },
};

const GOALIE_GREETING =
  "Welcome — I'm here to help. Paste any message, offer, or profile that feels off and I'll give you a clear read and your next steps. I handle romance and dating-app fraud, financial scams, ticket fraud, extortion, and more — in English o en español. **Every conversation is private and judgment-free.**";

const GOALIE_ASKS = [
  { label: "💸 'Sugar daddy' wants a gift card first", q: "Someone on Instagram offered to be my sugar daddy with a weekly allowance, but first I have to buy a $50 gift card to 'prove loyalty'. Is this a scam?" },
  { label: "💘 Match is asking me for money", q: "I met someone on a dating app, we really hit it off, and now they urgently need money for a family emergency. What do I do?" },
  { label: "🎫 Cheap tickets DM — legit?", q: "Someone is DMing me half-price World Cup tickets but I have to pay by bank transfer today. Legit?" },
  { label: "📱 'FIFA' dice que cancelaron mi boleto", q: "Me llegó un SMS de 'FIFA' diciendo que mi boleto fue cancelado y debo verificar mi tarjeta en 24 horas." },
];

// Delivered to every fan who shares a story — they just trained the Goalie.
const GOALIE_MANIFESTO = [
  "Your story is now part of my defense.",
  "What happened to you will NOT happen to the next fan — because you spoke up.",
  "Every save I make from today carries your experience in it.",
  "You are part of the community. Part of the wall. Part of the shield.",
];

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const GATE_TO_INDEX: Record<string, number> = { "Gate A": 0, "Gate B": 1, "Gate C": 2, "Gate D": 3 };

// ── File attachments — photos, PDFs, videos handed to the AI ──────────
// Caps mirror the backend (src/agents/media.py); keep them in sync.
type FileKind = "image" | "pdf" | "doc" | "video";
const FILE_CAPS_MB: Record<FileKind, number> = { image: 15, pdf: 18, doc: 18, video: 50 };
// Extensions are listed alongside the mime globs because some phone pickers
// filter on extension only.
const FILE_ACCEPT =
  "image/*,application/pdf,video/*,text/html,text/plain,text/csv," +
  ".pdf,.html,.htm,.txt,.md,.csv,.json,.xml,.rtf," +
  ".jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.m4v,.mov,.webm,.3gp";

// Phones often report "" or "application/octet-stream" for a picked file — most
// visibly for PDFs — so fall back to the extension before rejecting anything.
const EXT_KIND: Record<string, FileKind> = {
  pdf: "pdf",
  html: "doc", htm: "doc", txt: "doc", md: "doc", csv: "doc", json: "doc", xml: "doc", rtf: "doc",
  png: "image", jpg: "image", jpeg: "image", webp: "image", heic: "image", heif: "image",
  mp4: "video", m4v: "video", mov: "video", webm: "video", "3gp": "video",
  mpeg: "video", mpg: "video", avi: "video",
};

function fileKind(f: File): FileKind | null {
  const t = (f.type || "").toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t === "application/pdf") return "pdf";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("text/") || t === "application/json" || t === "application/rtf" || t === "application/xml") return "doc";
  const ext = (f.name || "").toLowerCase().split(".").pop() || "";
  return EXT_KIND[ext] ?? null;
}
function fileKindIcon(k: FileKind | null): string {
  return k === "image" ? "🖼️" : k === "pdf" ? "📄" : k === "doc" ? "📑" : k === "video" ? "🎬" : "📎";
}
function fileError(f: File): string | null {
  const k = fileKind(f);
  if (!k) return "Send a photo, a document (PDF/HTML/TXT/CSV), or a video.";
  const cap = FILE_CAPS_MB[k];
  const label = k === "doc" ? "document" : k;
  if (f.size > cap * 1024 * 1024) return `That ${label} is too large — keep it under ${cap}MB.`;
  return null;
}

// Matches only the signature's own line: [^\n] keeps it from spanning the whole
// message, and `m` ends it at the line break rather than the end of the text.
const SIG_STRIP = /(?:^|\n)[^\n]*(?:Strength[.\s]*Vigilance[.\s]*Intelligence|CyberShield AI\s*[—–-]\s*El Guardi[áa]n)[^\n]*$/gim;
function stripSignature(text: string): string {
  return text.replace(SIG_STRIP, "").trim();
}

const AGENTS = [
  { name: "Anti-Scammer Goalie",  gate: "Gate A", icon: "🥅", color: T.babyBlue,   match: /scam|phish|fraud|ticket|link|fake|verify/i },
  { name: "Sideline Referee",     gate: "Gate B", icon: "⚖️",  color: "#7CB9E8",   match: /gdpr|compliance|data|privacy|transfer/i },
  { name: "Red Card Sentinel",    gate: "Gate C", icon: "🛡️",  color: T.silver,    match: /deepfake|video|synthetic|media|manipulated/i },
  { name: "Las Barras Bravas",    gate: "Gate D", icon: "📡",  color: T.royalLight, match: /ddos|traffic|spike|flood|surge|telemetry/i },
];

// Tap-to-ask prompts — the interactive hook on the El Guardián console
const QUICK_ASKS = [
  { label: "🎫 Is this ticket site real?", q: "Is this World Cup ticket website legit and safe to buy from?" },
  { label: "🔗 Check a suspicious link",   q: "Check this suspicious World Cup link for scams or phishing" },
  { label: "🤖 Spot a deepfake",           q: "How can I tell if a viral World Cup video is a deepfake?" },
  { label: "📋 Today's threat briefing",   q: "Give me today's World Cup cyber threat briefing" },
];

function Corner({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`absolute w-3 h-3 ${className}`} style={style} />;
}

function BallDecal({ size = 70 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="50" cy="50" r="46" />
      <polygon points="50,33 66,45 60,63 40,63 34,45" fill="currentColor" stroke="none" />
      <line x1="50" y1="33" x2="50" y2="10" />
      <line x1="66" y1="45" x2="86" y2="36" />
      <line x1="60" y1="63" x2="72" y2="82" />
      <line x1="40" y1="63" x2="28" y2="82" />
      <line x1="34" y1="45" x2="14" y2="36" />
      <path d="M50,10 L34,16 M50,10 L66,16 M86,36 L84,20 M86,36 L92,52 M72,82 L56,88 M28,82 L44,88 M14,36 L8,52 M14,36 L16,20" />
    </svg>
  );
}

function TrophyDecal({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M32,12 H68 V34 a18,18 0 0 1 -36,0 Z" />
      <path d="M32,16 C16,17 17,36 33,38" />
      <path d="M68,16 C84,17 83,36 67,38" />
      <path d="M46,52 h8 l2,14 h-12 Z" />
      <rect x="34" y="68" width="32" height="6" rx="1" />
      <rect x="29" y="76" width="42" height="7" rx="1" />
      <path d="M50,20 l2.4,4.8 5.3,0.8 -3.8,3.7 0.9,5.2 -4.8,-2.5 -4.8,2.5 0.9,-5.2 -3.8,-3.7 5.3,-0.8 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

type DecalKind = "ball" | "trophy" | "none";

function Panel({ children, className = "", glow = false, decal = "ball" }: { children: React.ReactNode; className?: string; glow?: boolean; decal?: DecalKind }) {
  return (
    <div className={`relative ${className}`}
      style={{
        background: `linear-gradient(180deg, #0B1830 0%, ${T.panel} 55%, #050C1A 100%)`,
        boxShadow: "0 6px 24px #00000066",
      }}>
      {/* Soccer decal watermarks */}
      {decal !== "none" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden
          style={{ color: T.babyBlue }}>
          <div className="absolute -bottom-4 -right-4 opacity-[0.06]" style={{ transform: "rotate(-18deg)" }}>
            {decal === "ball" ? <BallDecal /> : <TrophyDecal />}
          </div>
          <svg className="absolute -top-1 -left-1 opacity-[0.05]" width="90" height="44" viewBox="0 0 90 44"
            fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M-6,40 C18,12 54,6 96,14" />
            <path d="M-6,32 C20,6 56,0 96,6" opacity="0.6" />
          </svg>
        </div>
      )}
      {/* corner brackets */}
      <Corner className={`top-0 left-0 border-t-2 border-l-2`} style={{ borderColor: T.babyBlue } as React.CSSProperties} />
      <Corner className={`top-0 right-0 border-t-2 border-r-2`} style={{ borderColor: T.babyBlue } as React.CSSProperties} />
      <Corner className={`bottom-0 left-0 border-b-2 border-l-2`} style={{ borderColor: T.babyBlue } as React.CSSProperties} />
      <Corner className={`bottom-0 right-0 border-b-2 border-r-2`} style={{ borderColor: T.babyBlue } as React.CSSProperties} />
      <div
        className="h-full"
        style={{
          border: `1px solid ${T.royalBlue}80`,
          boxShadow: glow ? `0 0 30px ${T.babyBlue}18, inset 0 0 30px ${T.royalBlue}10` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function BarChart({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-[3px] h-12">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all" style={{
          height: `${(v / max) * 100}%`,
          background: i >= values.length - 2
            ? `linear-gradient(180deg, ${T.babyBlue}, ${T.royalLight})`
            : `${T.royalBlue}90`,
        }} />
      ))}
    </div>
  );
}

function EagleMark({ size = 14, color = "#fff", glow = T.babyBlue }: { size?: number; color?: string; glow?: string }) {
  const mask: React.CSSProperties = {
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
  };
  return (
    <span aria-hidden className="inline-block flex-shrink-0" style={{ filter: `drop-shadow(0 0 3px ${glow})` }}>
      <span className="block" style={mask} />
    </span>
  );
}

function StatRow({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px]" style={{ color: T.silverDim }}>{label}</span>
      <span className="text-[15px] font-bold font-mono" style={{ color, textShadow: `0 0 8px ${color}40` }}>{value}</span>
    </div>
  );
}

// Paperclip button + hidden file input — attach a photo, PDF, or video.
function AttachButton({ onPick, disabled, color = T.babyBlue }: { onPick: (f: File) => void; disabled?: boolean; color?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept={FILE_ACCEPT} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
      <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => ref.current?.click()} disabled={disabled}
        title="Attach a photo, PDF, or video"
        aria-label="Attach a photo, PDF, or video"
        className="flex items-center justify-center px-3 rounded-lg flex-shrink-0 disabled:opacity-50"
        style={{ background: `${color}12`, border: `1px solid ${color}45`, color }}>
        <Paperclip className="w-4 h-4" />
      </motion.button>
    </>
  );
}

// Chip showing the currently attached file, with a clear button.
function FileChip({ file, onClear, color = T.babyBlue }: { file: File; onClear: () => void; color?: string }) {
  const k = fileKind(file);
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] self-start max-w-full"
      style={{ background: `${color}12`, border: `1px solid ${color}40`, color: T.silver }}>
      <span className="text-[15px] flex-shrink-0">{fileKindIcon(k)}</span>
      <span className="truncate" style={{ maxWidth: 180 }} title={file.name}>{file.name}</span>
      <span className="flex-shrink-0" style={{ color: T.silverDim }}>{(file.size / (1024 * 1024)).toFixed(1)}MB</span>
      <button type="button" onClick={onClear} aria-label="Remove attachment"
        className="ml-1 flex-shrink-0 hover:opacity-70" style={{ color: T.silverDim }}>✕</button>
    </div>
  );
}

function EagleEye() {
  const W = 280, H = 110;
  const CY = 58;
  const L = 2, R = 278;
  const RY = CY + 10; // outer corner drops — brow presses down into the glare
  const eyeShape = `M${L},${CY} C56,8 188,0 ${R},${RY} C216,100 72,106 ${L},${CY} Z`;

  return (
    <div className="relative flex-shrink-0" style={{ width: W, height: H }}>

      {/* Glow halo (does not blink) */}
      <div className="absolute inset-0 pointer-events-none blur-2xl opacity-60"
        style={{ background: `radial-gradient(ellipse 75% 70%, ${T.babyBlue}, transparent 70%)` }} />

      {/* Blink: the whole eye squeezes shut and reopens */}
      <motion.div
        className="absolute inset-0"
        animate={{ scaleY: [1, 0.04, 1] }}
        transition={{ duration: 0.4, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" }}
        style={{ transformOrigin: "center" }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0"
          style={{ overflow: "visible", filter: `drop-shadow(0 0 8px ${T.babyBlue}cc)` }}>

          <defs>
            <clipPath id="ec"><path d={eyeShape} /></clipPath>
            <radialGradient id="vig" cx="50%" cy="50%" r="55%">
              <stop offset="0%"  stopColor="#030b17" stopOpacity="0" />
              <stop offset="86%" stopColor="#030b17" stopOpacity="0" />
              <stop offset="100%" stopColor="#030b17" stopOpacity="0.45" />
            </radialGradient>
          </defs>

          {/* Eye interior */}
          <path d={eyeShape} fill="#030b17" />

          {/* CyberShield logo filling the whole eye */}
          <image href="/cbsd_logo.png" x={L} y={0} width={R - L} height={H}
            preserveAspectRatio="xMidYMid slice" clipPath="url(#ec)" />

          {/* Edge vignette so the logo blends into the eye shape */}
          <path d={eyeShape} fill="url(#vig)" />

          {/* Scanning beam sweeping across the eye */}
          <motion.rect y={0} width="14" height={H} fill={T.babyBlue} opacity="0.25"
            animate={{ x: [L, R - 14, L] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            clipPath="url(#ec)" />

          {/* Outer soft glow ring */}
          <path d={`M${L},${CY} C56,8 188,0 ${R},${RY}`}
            fill="none" stroke={T.babyBlue} strokeWidth="7" strokeLinecap="round" opacity="0.22" />
          <path d={`M${L},${CY} C72,106 216,100 ${R},${RY}`}
            fill="none" stroke={T.babyBlue} strokeWidth="7" strokeLinecap="round" opacity="0.22" />

          {/* Eye outline */}
          <path d={`M${L},${CY} C56,8 188,0 ${R},${RY}`}
            fill="none" stroke={T.babyBlue} strokeWidth="2.5" strokeLinecap="round" />
          <path d={`M${L},${CY} C72,106 216,100 ${R},${RY}`}
            fill="none" stroke={T.babyBlue} strokeWidth="2.5" strokeLinecap="round" />

          {/* Brow ridge — high at the inner corner, pressing down over the outer */}
          <path d={`M${L - 8},${CY - 18} C58,-16 198,-6 ${R + 10},${RY - 7}`}
            fill="none" stroke={T.babyBlue} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          <path d={`M${L - 8},${CY - 18} C58,-16 198,-6 ${R + 10},${RY - 7}`}
            fill="none" stroke={T.babyBlue} strokeWidth="8" strokeLinecap="round" opacity="0.15" />

          {/* Corner flicks — inner tear duct up, outer wing sweeping down */}
          <line x1={L} y1={CY} x2={L - 12} y2={CY - 4} stroke={T.babyBlue} strokeWidth="2.5" strokeLinecap="round" />
          <line x1={R} y1={RY} x2={R + 15} y2={RY + 9} stroke={T.babyBlue} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={L} cy={CY} r="3" fill={T.babyBlue} />
          <circle cx={R} cy={RY} r="3" fill={T.babyBlue} />
        </svg>
      </motion.div>
    </div>
  );
}

function BrandLogo() {
  const [hasLogo, setHasLogo] = useState(true);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // error event can fire before hydration — recheck once mounted
    if (ref.current?.complete && ref.current.naturalWidth === 0) setHasLogo(false);
  }, []);
  if (!hasLogo) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${T.royalBlue}60`, border: `1px solid ${T.babyBlue}60` }}>
        <Shield className="w-4 h-4" style={{ color: T.babyBlue }} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src="/papicyberzlogo.png" alt="PC Digital Solutions"
      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      style={{ border: `1px solid ${T.babyBlue}70`, boxShadow: `0 0 12px ${T.babyBlue}50` }}
      onError={() => setHasLogo(false)} />
  );
}

function GoalieZone({ active }: { active: boolean }) {
  const [turns, setTurns] = useState<GoalieTurn[]>([{ role: "model", text: GOALIE_GREETING }]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [attached, setAttached] = useState<File | null>(null);
  const [feed, setFeed] = useState<StoryFeed | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyType, setStoryType] = useState("tickets");
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [contributorNum, setContributorNum] = useState<number | null>(null);
  const [prefilledFromChat, setPrefilledFromChat] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open the "add my story" form, pulling in what the tester already told the
  // Goalie so they never have to retype their story to share it to the wall.
  const openReport = () => {
    const lastUser = [...turns].reverse().find(t => t.role === "user")?.text?.trim();
    if (lastUser && !storyText.trim()) {
      setStoryText(lastUser);
      setPrefilledFromChat(true);
    }
    setShowReport(true);
  };

  // Reject bad files the moment they're picked — never silently drop one on send.
  const onPickFile = (f: File) => {
    const err = fileError(f);
    if (err) { setTurns(t => [...t, { role: "model", text: `🧤 ${err}` }]); return; }
    setAttached(f);
  };

  const scrollToBottom = () =>
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });

  const onChatScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 48);
  };

  const loadStories = () =>
    fetch(`${API_BASE}/goalie/stories?limit=8`)
      .then(r => r.json())
      .then(setFeed)
      .catch(() => {});
  useEffect(() => { loadStories(); }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, sending]);

  const send = async (raw?: string) => {
    const text = (raw ?? msg).trim();
    const file = attached;
    if ((!text && !file) || sending) return;
    if (file) {
      const err = fileError(file);
      if (err) { setTurns(t => [...t, { role: "model", text: `🧤 ${err}` }]); setAttached(null); return; }
    }
    const history = turns.map(t => ({ role: t.role, text: t.text }));
    const fileLabel = file ? `${fileKindIcon(fileKind(file))} ${file.name}` : undefined;
    setTurns(t => [...t, { role: "user", text: text || "(sent a file for the Goalie to check)", file: fileLabel }]);
    setMsg("");
    setAttached(null);
    setSending(true);
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("message", text);
        fd.append("history", JSON.stringify(history));
        res = await fetch(`${API_BASE}/goalie/chat/file`, { method: "POST", body: fd });
      } else {
        res = await fetch(`${API_BASE}/goalie/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setTurns(t => [...t, { role: "model", text: `🧤 ${data.detail || "Could not read that — try again."}` }]);
        return;
      }
      setTurns(t => [...t, { role: "model", text: data.response ?? "…", matches: data.community_matches }]);
    } catch {
      setTurns(t => [...t, { role: "model", text: "Connection to the box dropped — verify the backend is running on 127.0.0.1:8000." }]);
    } finally {
      setSending(false);
    }
  };

  const submitStory = async () => {
    if (!consent || storyText.trim().length < 20 || submitState === "sending") return;
    setSubmitState("sending");
    try {
      const res = await fetch(`${API_BASE}/goalie/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: storyText.trim(), scam_type: storyType, language: "", consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(typeof data.detail === "string" ? data.detail : "Could not save — is the backend online?");
        setSubmitState("error");
        return;
      }
      setContributorNum(data.total ?? null);
      setSubmitState("done");
      setStoryText("");
      setConsent(false);
      setPrefilledFromChat(false);
      loadStories();
    } catch {
      setSubmitError("Could not save — is the backend online?");
      setSubmitState("error");
    }
  };

  return (
    <div className={`relative z-10 w-full max-w-[680px] flex-1 min-h-0 flex-col gap-2 ${active ? "flex" : "hidden"}`}>

      {/* Goalie header */}
      <div className="flex items-center gap-2 flex-shrink-0 px-1">
        <span className="text-base">🥅</span>
        <span className="text-[13px] font-black tracking-[0.2em]" style={{ color: "#fff" }}>ANTI-SCAMMER GOALIE</span>
        <span className="text-[11px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
          style={{ background: `${T.babyBlue}15`, border: `1px solid ${T.babyBlue}50`, color: T.babyBlue }}>GATE A</span>
        <span className="ml-auto text-[11px] tracking-[0.14em]" style={{ color: T.silverDim }}>
          {feed ? `🛡️ ${feed.total} COMMUNITY REPORTS · ${feed.this_week} THIS WEEK` : "CONNECTING…"}
        </span>
      </div>

      {/* Community mission — one clean, readable line */}
      <div className="flex-shrink-0 px-3.5 py-2 rounded-lg flex items-center gap-2.5"
        style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}30` }}>
        <span className="text-[14px] flex-shrink-0">🤝</span>
        <span className="text-[13px] leading-relaxed" style={{ color: T.silver }}>
          <span className="font-bold" style={{ color: GOLD }}>Community mission — </span>
          every story you share trains the Goalie and protects the next person.
          <span style={{ color: GOLD }}> Tu historia protege a la próxima familia. 💙</span>
        </span>
      </div>

      {/* Chat window — min height guarantees the chat never gets crushed by the wall */}
      <Panel className="flex-1 flex flex-col min-h-[200px]">
        <div className="h-full flex flex-col min-h-0">
        <div className="relative flex-1 min-h-0">
        <div ref={scrollRef} onScroll={onChatScroll} className="absolute inset-0 overflow-y-auto cs-scroll p-4 space-y-3.5">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-br-md text-[15px] leading-relaxed break-words"
                  style={{ background: `${T.royalBlue}55`, border: `1px solid ${T.royalBlue}`, color: "#E3F2FD" }}>
                  {t.file && (
                    <div className="flex items-center gap-1.5 mb-1 text-[13px] font-semibold" style={{ color: T.babyBlue }}>
                      {t.file}
                    </div>
                  )}
                  {t.text}
                </div>
              </div>
            ) : (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-bl-md"
                  style={{ background: `${T.babyBlue}0D`, border: `1px solid ${T.babyBlue}35` }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[13px]">🥅</span>
                    <span className="text-[11px] font-bold tracking-[0.2em]" style={{ color: T.babyBlue }}>GOALIE</span>
                    {(t.matches ?? 0) > 0 && (
                      <span className="text-[11px] font-bold tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}50`, color: GOLD }}>
                        🛡️ COMMUNITY INTEL ×{t.matches}
                      </span>
                    )}
                  </div>
                  <RichText text={t.text} />
                </div>
              </motion.div>
            )
          )}
          {sending && (
            <div className="flex items-center gap-2 text-[13px]" style={{ color: T.silverDim }}>
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: T.babyBlue, borderTopColor: "transparent" }} />
              The Goalie is reading the play…
            </div>
          )}
          {/* Share-to-wall CTA — appears once the tester has told their story, so
              they can add it to the wall without retyping a single word */}
          {!sending && !showReport && turns.some(t => t.role === "user") && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center pt-1">
              <button onClick={openReport}
                className="flex items-center gap-1.5 text-[13px] font-bold tracking-[0.1em] px-3.5 py-2 rounded-full transition-transform hover:scale-[1.03]"
                style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}45`, color: GOLD }}>
                🛡️ Share this with the community wall →
              </button>
            </motion.div>
          )}
        </div>

        {/* Jump-to-latest — shows whenever the chat is scrolled up */}
        <AnimatePresence>
          {!atBottom && (
            <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              onClick={scrollToBottom}
              className="absolute bottom-2 right-3 z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-bold tracking-wider"
              style={{ background: `${T.royalBlue}E6`, border: `1px solid ${T.babyBlue}70`, color: T.babyBlue, boxShadow: `0 0 12px ${T.babyBlue}40` }}>
              ↓ LATEST
            </motion.button>
          )}
        </AnimatePresence>
        </div>

        {/* quick asks + input */}
        {/* (input stays pinned below the scroll region) */}
        <div className="flex-shrink-0 p-2.5 pt-0 flex flex-col gap-2">
          {turns.length <= 1 && (
            <div className="grid grid-cols-2 gap-2">
              {GOALIE_ASKS.map(c => (
                <button key={c.label} onClick={() => send(c.q)} disabled={sending}
                  className="text-[13px] font-semibold text-center px-2.5 py-2 rounded-lg leading-snug transition-transform hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: `${T.babyBlue}10`, border: `1px solid ${T.babyBlue}35`, color: T.babyBlue }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {attached && <FileChip file={attached} onClear={() => setAttached(null)} />}
          <div className="flex gap-2 items-stretch">
            <AttachButton onPick={onPickFile} disabled={sending} />
            <textarea value={msg} rows={2}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={attached ? "Add a note (optional) and send… / Añade una nota (opcional)…" : "Paste the suspicious message here… / Pega aquí el mensaje sospechoso…"}
              className="flex-1 px-3.5 py-2.5 text-[14px] outline-none rounded-lg resize-none leading-relaxed cs-scroll"
              style={{ background: "#08121f", border: `1px solid ${T.babyBlue}45`, color: T.silver }}
            />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => send()} disabled={sending}
              className="px-4 text-[13px] font-bold tracking-[0.16em] rounded-lg disabled:opacity-60 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`, color: "#050d18" }}>
              SEND
            </motion.button>
          </div>
        </div>
        </div>
      </Panel>

      {/* Community wall / report form */}
      <Panel className="flex-shrink-0" decal="none">
        {showReport ? (
          <div className="p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold tracking-[0.16em]" style={{ color: GOLD }}>🛡️ ADD YOUR STORY TO THE COMMUNITY WALL</span>
              <button onClick={() => { setShowReport(false); setSubmitState("idle"); setPrefilledFromChat(false); }}
                className="ml-auto text-[12px] px-2 py-0.5 rounded hover:bg-white/5" style={{ color: T.silverDim }}>✕ CLOSE</button>
            </div>
            {submitState === "done" ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-3 rounded-lg text-center"
                style={{ background: `linear-gradient(135deg, ${GOLD}14, ${T.babyBlue}0E)`, border: `1px solid ${GOLD}55`, boxShadow: `0 0 24px ${GOLD}20` }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                  className="text-xl mb-1">🧤</motion.div>
                <div className="text-[13px] font-black tracking-[0.24em] mb-2" style={{ color: GOLD }}>
                  THE GOALIE&apos;S PROMISE
                </div>
                <div className="space-y-1 mb-2">
                  {GOALIE_MANIFESTO.map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.35 }}
                      className="text-[13px] leading-relaxed" style={{ color: "#E3F2FD" }}>
                      {line}
                    </motion.div>
                  ))}
                </div>
                {contributorNum && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
                    className="text-[12px] font-bold tracking-[0.18em] mb-1.5" style={{ color: T.babyBlue }}>
                    ⭐ DEFENDER #{contributorNum} ON THE COMMUNITY WALL ⭐
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1 }}
                  className="text-[12px] font-bold" style={{ color: GOLD }}>
                  Gracias. De verdad — mil gracias. 💙 You make the shield stronger.
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}
                  className="text-[11px] tracking-wider mt-1.5" style={{ color: T.silverDim }}>
                  — THE ANTI-SCAMMER GOALIE · WITH RAÍCES CYBER &amp; OUR BETA TESTERS
                </motion.div>
                <button onClick={() => { setShowReport(false); setSubmitState("idle"); }}
                  className="mt-2 px-3 py-1 text-[12px] font-bold tracking-[0.14em] rounded-md transition-transform hover:scale-[1.03]"
                  style={{ background: `${T.babyBlue}15`, border: `1px solid ${T.babyBlue}50`, color: T.babyBlue }}>
                  BACK TO THE WALL
                </button>
              </motion.div>
            ) : (
              <>
                {prefilledFromChat && (
                  <div className="flex items-center gap-1.5 text-[12px] leading-relaxed" style={{ color: T.babyBlue }}>
                    <span>💬</span>
                    <span>Pulled from your chat — edit it however you like before sharing.</span>
                  </div>
                )}
                <textarea value={storyText} rows={4}
                  onChange={e => setStoryText(e.target.value)}
                  placeholder="What happened? No names needed — emails and phone numbers are scrubbed automatically. / ¿Qué pasó? Sin nombres — correos y teléfonos se borran automáticamente."
                  className="w-full px-3.5 py-2.5 text-[14px] outline-none rounded-lg resize-none leading-relaxed cs-scroll"
                  style={{ background: "#08121f", border: `1px solid ${GOLD}45`, color: T.silver }} />
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={storyType} onChange={e => setStoryType(e.target.value)}
                    className="px-2 py-1.5 text-[13px] rounded-md outline-none"
                    style={{ background: "#08121f", border: `1px solid ${T.royalBlue}80`, color: T.silver }}>
                    {(feed?.scam_types ?? Object.keys(SCAM_TYPE_META)).map(t => (
                      <option key={t} value={t}>{SCAM_TYPE_META[t]?.icon ?? "⚠️"} {SCAM_TYPE_META[t]?.label ?? t}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-[12px] cursor-pointer" style={{ color: T.silver }}>
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                    Share anonymously with the community
                  </label>
                  <button onClick={submitStory}
                    disabled={!consent || storyText.trim().length < 20 || submitState === "sending"}
                    className="ml-auto px-3 py-1.5 text-[12px] font-bold tracking-[0.14em] rounded-md disabled:opacity-40"
                    style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, color: GOLD }}>
                    {submitState === "sending" ? "SAVING…" : "SUBMIT STORY"}
                  </button>
                </div>
                {submitState === "error" && (
                  <div className="text-[12px]" style={{ color: "#FF8C42" }}>🧤 {submitError}</div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[13px] font-bold tracking-[0.18em]" style={{ color: GOLD }}>🛡️ COMMUNITY SCAM WALL</span>
              <span className="text-[12px] tracking-wide" style={{ color: T.silverDim }}>
                {feed ? `${feed.total} reports` : ""}
              </span>
              <button onClick={openReport}
                className="ml-auto px-3 py-1.5 text-[12px] font-bold tracking-[0.12em] rounded-md transition-transform hover:scale-[1.03]"
                style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}55`, color: GOLD }}>
                ➕ ADD MY STORY
              </button>
            </div>
            <div className="max-h-[132px] overflow-y-auto cs-scroll space-y-2 pr-1">
              {feed?.stories?.length ? feed.stories.map(s => (
                <div key={s.id} className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg"
                  style={{ background: `${T.royalBlue}14`, border: `1px solid ${T.royalBlue}35` }}>
                  <span className="text-[14px] flex-shrink-0 mt-px">{SCAM_TYPE_META[s.scam_type]?.icon ?? "⚠️"}</span>
                  <span className="text-[13px] leading-relaxed break-words flex-1" style={{ color: T.silver }}>{s.story}</span>
                  <span className="text-[11px] flex-shrink-0 mt-1 tracking-wide" style={{ color: T.silverDim }}>{timeAgo(s.created)}</span>
                </div>
              )) : (
                <div className="text-[13px]" style={{ color: T.silverDim }}>Loading community reports…</div>
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

const LANG_LABEL: Record<string, string> = { en: "English", es: "Español", unknown: "Unspecified" };

function MissionTile({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5 rounded"
      style={{ background: `${color}0E`, border: `1px solid ${color}33` }}>
      <span className="text-[18px] font-bold font-mono leading-none" style={{ color, textShadow: `0 0 10px ${color}55` }}>{value}</span>
      <span className="text-[11px] tracking-[0.14em] uppercase" style={{ color: T.silverDim }}>{label}</span>
    </div>
  );
}

function MissionCard({ m }: { m: Mission }) {
  const h = m.headline;
  const scam = Object.entries(m.scam_types).sort((a, b) => b[1] - a[1]);
  const scamMax = Math.max(1, ...scam.map(([, n]) => n));
  const activity = Object.values(m.activity_by_day);
  const archived = new Date(m.generated_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="rounded" style={{ background: `${T.royalBlue}12`, border: `1px solid ${T.royalBlue}55` }}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 flex-wrap"
        style={{ borderBottom: `1px solid ${T.royalBlue}44` }}>
        <span className="text-xs">🏆</span>
        <span className="text-[14px] font-bold tracking-wide" style={{ color: "#fff" }}>{m.name}</span>
        <span className="text-[12px] font-bold tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: `${T.neonGreen}18`, border: `1px solid ${T.neonGreen}55`, color: T.neonGreen }}>
          ✓ COMPLETED MISSION
        </span>
        <span className="ml-auto text-[12px] tracking-wider" style={{ color: T.silverDim }}>{m.window}</span>
      </div>

      <div className="p-3.5 flex flex-col gap-3.5">
        {/* Headline stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {h.threats_assessed != null && (
            <MissionTile label="Threats assessed" value={h.threats_assessed.toLocaleString()} color={T.babyBlue} />
          )}
          <MissionTile label="Stories collected" value={h.stories_collected} color={GOLD} />
          <MissionTile label="Goalie chats" value={h.goalie_chat_turns} color={T.neonGreen} />
          <MissionTile label="Intel hit rate" value={`${+(h.community_intel_hit_rate * 100).toFixed(1)}%`} color={T.royalLight} />
          {h.site_visits != null && <MissionTile label="Site visits" value={h.site_visits.toLocaleString()} color={T.babyBlue} />}
          {h.feedback_responses != null && <MissionTile label="Feedback" value={h.feedback_responses} color={GOLD} />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Scam types */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[12px] tracking-[0.16em] uppercase mb-0.5" style={{ color: T.silverDim }}>Threats reported by community</div>
            {scam.map(([type, n]) => {
              const meta = SCAM_TYPE_META[type] ?? SCAM_TYPE_META.other;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-[13px] w-4 text-center">{meta.icon}</span>
                  <span className="text-[13px] flex-shrink-0 w-24 truncate" style={{ color: T.silver }}>{meta.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${T.royalBlue}40` }}>
                    <div className="h-full rounded-full" style={{ width: `${(n / scamMax) * 100}%`, background: T.babyBlue, boxShadow: `0 0 6px ${T.babyBlue}` }} />
                  </div>
                  <span className="text-[13px] font-mono w-4 text-right" style={{ color: T.silverDim }}>{n}</span>
                </div>
              );
            })}
          </div>

          {/* Activity + languages */}
          <div className="flex flex-col gap-2.5">
            <div>
              <div className="text-[12px] tracking-[0.16em] uppercase mb-1.5" style={{ color: T.silverDim }}>Activity over the tournament</div>
              {activity.length > 0 ? <BarChart values={activity} /> : <div className="text-[13px]" style={{ color: T.silverDim }}>No activity recorded.</div>}
            </div>
            <div>
              <div className="text-[12px] tracking-[0.16em] uppercase mb-1.5" style={{ color: T.silverDim }}>Languages served</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(m.languages).map(([lang, n]) => (
                  <span key={lang} className="text-[12px] tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}40`, color: T.silver }}>
                    {LANG_LABEL[lang] ?? lang} · {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] tracking-wider text-right" style={{ color: T.silverDim }}>
          Archived {archived} · verifiable local evidence set
        </div>
      </div>
    </div>
  );
}

function CompletedMissions({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Render nothing when closed so the overlay unmounts instantly — the previous
  // AnimatePresence exit left an invisible full-screen click-trap after closing.
  if (!open) return null;
  return (
    <>
        <motion.div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
          style={{ background: "rgba(2,7,14,0.78)", backdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-3xl my-auto rounded-lg overflow-hidden"
            style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, boxShadow: `0 0 40px ${T.royalBlue}55` }}
            initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: `1px solid ${T.panelBorder}`, background: `linear-gradient(90deg, ${T.royalBlue}30, transparent)` }}>
              <Crosshair className="w-4 h-4" style={{ color: T.babyBlue }} />
              <span className="text-[14px] font-bold tracking-[0.22em]" style={{ color: "#fff" }}>COMPLETED MISSIONS</span>
              <span className="text-[12px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
                style={{ background: `${T.babyBlue}18`, border: `1px solid ${T.babyBlue}45`, color: T.babyBlue }}>{MISSIONS.length}</span>
              <button onClick={onClose} aria-label="Close"
                className="ml-auto w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                style={{ color: T.silver }}>✕</button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
              <p className="text-[13px] leading-relaxed" style={{ color: T.silverDim }}>
                Archived after-action records from CyberShield deployments. Every figure below is real,
                anonymized mission data — no personal information leaves the vault.
              </p>
              {MISSIONS.map(m => <MissionCard key={m.id} m={m} />)}
            </div>
          </motion.div>
        </motion.div>
    </>
  );
}

// Vibrant, artist-energy accents — cycled across the VIP tour cards.
const EVENT_ACCENTS = [
  "#FF4D8D", "#F2C14E", "#00CFFF", "#A855F7", "#FF6B35", "#39FF14",
  "#FF3B7B", "#4ADE80", "#38BDF8", "#FB7185", "#C084FC",
];

function EventCard({ e, accent, onAsk }: { e: VipEvent; accent: string; onAsk: (e: VipEvent) => void }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.012 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-lg overflow-hidden flex flex-col"
      style={{
        background: `linear-gradient(150deg, ${accent}22, ${T.royalBlue}10 58%, transparent)`,
        border: `1px solid ${accent}55`,
      }}
    >
      <span className="block h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="p-3.5 flex flex-col gap-3 flex-1">
        {/* Artist header */}
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none flex-shrink-0">{e.flag}</span>
          <div className="min-w-0">
            <div className="text-[15px] font-bold tracking-wide truncate" style={{ color: "#fff" }}>{e.artist}</div>
            <div className="text-[12px] truncate" style={{ color: T.silverDim }}>{e.genre} · {e.origin}</div>
          </div>
          <span className="ml-auto text-[11px] font-bold tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: `${accent}1E`, border: `1px solid ${accent}66`, color: accent }}>
            UPCOMING
          </span>
        </div>

        {/* Threat profile — what El Guardián defends against */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.silverDim }}>El Guardián defends against</div>
          <div className="flex flex-wrap gap-1.5">
            {e.scams.map(s => {
              const m = CONCERT_SCAM_META[s];
              return (
                <span key={s} title={m.label}
                  className="text-[12px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{ background: `${T.royalBlue}26`, border: `1px solid ${T.royalBlue}66`, color: T.silver }}>
                  <span>{m.icon}</span>{m.short}
                </span>
              );
            })}
          </div>
        </div>

        {/* Reach */}
        <div className="flex flex-wrap gap-1.5">
          {e.reach.map(r => (
            <span key={r} className="text-[11px] px-1.5 py-0.5 rounded-full"
              style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}33`, color: T.silverDim }}>{r}</span>
          ))}
        </div>

        {/* The hook — one tap into a live, tailored El Guardián briefing */}
        <button onClick={() => onAsk(e)}
          className="mt-auto w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md transition-transform hover:scale-[1.02] active:scale-[0.99]"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}AA)`, color: "#0a0a0a", boxShadow: `0 0 18px ${accent}55` }}>
          <Shield className="w-4 h-4" />
          <span className="text-[13px] font-bold tracking-[0.12em]">PROTECT MY TICKETS</span>
        </button>
      </div>
    </motion.div>
  );
}

function VipTours({ open, onClose, onAsk }: { open: boolean; onClose: () => void; onAsk: (e: VipEvent) => void }) {
  // Render nothing when closed so the overlay unmounts instantly and can never
  // linger as an invisible click-trap. Enter animation is kept via motion; no
  // exit animation (AnimatePresence's exit-removal was failing to unmount here).
  if (!open) return null;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(2,7,14,0.8)", backdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-4xl my-auto rounded-lg overflow-hidden"
        style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, boxShadow: `0 0 44px ${T.royalBlue}66` }}
        initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: `1px solid ${T.panelBorder}`, background: `linear-gradient(90deg, ${T.royalBlue}30, transparent)` }}>
          <span className="text-base">🎤</span>
          <span className="text-[14px] font-bold tracking-[0.22em]" style={{ color: "#fff" }}>VIP TOUR DEFENSE</span>
          <span className="text-[12px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ background: `${T.babyBlue}18`, border: `1px solid ${T.babyBlue}45`, color: T.babyBlue }}>{VIP_EVENTS.length}</span>
          <button onClick={onClose} aria-label="Close"
            className="ml-auto w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
            style={{ color: T.silver }}>✕</button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3.5 max-h-[82vh] overflow-y-auto">
          <p className="text-[13px] leading-relaxed" style={{ color: T.silver }}>
            <span className="font-bold" style={{ color: GOLD }}>El Guardián&apos;s next missions.</span>{" "}
            VIP artist tours draw the same scam surge as the World Cup — fake presales, resale fraud,
            bogus VIP passes. Find your artist and get an <span style={{ color: T.babyBlue }}>instant, tailored
            safety briefing</span> from El Guardián.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VIP_EVENTS.map((e, i) => (
              <EventCard key={e.id} e={e} accent={EVENT_ACCENTS[i % EVENT_ACCENTS.length]} onAsk={onAsk} />
            ))}
          </div>
          <p className="text-[11px] tracking-wider text-center" style={{ color: T.silverDim }}>
            Curated VIP watch profiles · your artist not here? Ask El Guardián about any show.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CyberShieldCommandCenter() {
  const [input, setInput]     = useState("");
  const [query, setQuery]     = useState("");
  const [response, setResponse] = useState(
    "El Guardián is ready to tackle any breach with knowledge, defense plays, and ways to keep you safe during the FIFA World Cup 2026!!"
  );
  const [loading, setLoading]   = useState(false);
  const [attached, setAttached] = useState<File | null>(null);
  const [activeAgent, setActiveAgent] = useState<number | null>(null);
  const [agentReports, setAgentReports] = useState<AgentReport[]>([]);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [threatFeed, setThreatFeed] = useState<ThreatFeed | null>(null);
  const [intel, setIntel] = useState<IntelFeed | null>(null);
  const [rightTab, setRightTab] = useState<"standings" | "fixtures" | "news">("news");
  const [centerTab, setCenterTab] = useState<"guardian" | "goalie">("guardian");
  const [showMissions, setShowMissions] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const primaryMission = MISSIONS[0];
  const mh = primaryMission?.headline;

  useEffect(() => {
    const load = () =>
      fetch(`${API_BASE}/threats/live?limit=60`)
        .then(r => r.json())
        .then(setThreatFeed)
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // Industry Pulse — live cyber + AI news via same-origin Next route (/api/intel).
  useEffect(() => {
    const load = () =>
      fetch(`/api/intel`)
        .then(r => r.json())
        .then(setIntel)
        .catch(() => {});
    load();
    const t = setInterval(load, 300000);
    return () => clearInterval(t);
  }, []);

  const engagedIdx = new Set(agentReports.map(r => GATE_TO_INDEX[r.gate]));

  const critCount = threatFeed?.threats.filter(t => t.severity === "CRITICAL").length ?? 0;
  const posture = !threatFeed
    ? { label: "BOOTING", color: T.silverDim }
    : critCount > 0
      ? { label: "HEIGHTENED", color: "#FF8C42" }
      : { label: "ACTIVE GUARD", color: T.neonGreen };
  const gateThreatCount = (gate: string) =>
    threatFeed?.threats.filter(t => t.kind === "threat" && t.primary_gate === gate).length ?? 0;
  const loadedThreatTotal = threatFeed?.threats.filter(t => t.kind === "threat").length ?? 0;

  const runSignal = async (raw: string) => {
    // Analyze exactly what was sent — never substitute a canned signal, which
    // answered with unrelated tournament chatter on an empty submit.
    const signal = raw.trim();
    setLoading(true);
    setAgentReports([]);
    setQuery(signal);
    setAnalyzedCount(c => c + 1);
    try {
      const res = await fetch(`${API_BASE}/analyze?signal=${encodeURIComponent(signal)}`);
      const data = await res.json();
      if (data.status === "ok" && data.response) {
        setResponse(data.response);
        const reports: AgentReport[] = data.agents ?? [];
        setAgentReports(reports);
        if (reports.length) setBlockedCount(c => c + 1);
        const primary = data.primary_gate ? GATE_TO_INDEX[data.primary_gate] : AGENTS.findIndex(a => a.match.test(signal));
        setActiveAgent(primary >= 0 ? primary : null);
      }
    } catch {
      setResponse("Error contacting backend. Verify FastAPI is running on 127.0.0.1:8000.");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  // Reject bad files the moment they're picked — never silently drop one on send.
  const onPickFile = (f: File) => {
    const err = fileError(f);
    if (err) { setResponse(`🛡️ ${err}`); return; }
    setAttached(f);
  };

  // Upload path — hand a photo, PDF, or video to El Guardián + the gates.
  const runSignalFile = async (file: File, note: string) => {
    setLoading(true);
    setAgentReports([]);
    const kind = fileKind(file);
    setQuery(`${fileKindIcon(kind)} ${file.name}${note ? " — " + note : ""}`);
    setAnalyzedCount(c => c + 1);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("note", note);
      const res = await fetch(`${API_BASE}/analyze/file`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.status === "ok" && data.response) {
        setResponse(data.response);
        const reports: AgentReport[] = data.agents ?? [];
        setAgentReports(reports);
        if (reports.length) setBlockedCount(c => c + 1);
        const primary = data.primary_gate ? GATE_TO_INDEX[data.primary_gate] : -1;
        setActiveAgent(primary >= 0 ? primary : null);
      } else {
        setResponse(data.detail || "El Guardián couldn't read that file. Try another photo, PDF, or video.");
      }
    } catch {
      setResponse("Error contacting backend. Verify FastAPI is running on 127.0.0.1:8000.");
    } finally {
      setLoading(false);
      setInput("");
      setAttached(null);
    }
  };

  const handleActivate = () => {
    if (attached) {
      const err = fileError(attached);
      if (err) { setResponse(`🛡️ ${err}`); setAttached(null); return; }
      runSignalFile(attached, input.trim());
      return;
    }
    runSignal(input);
  };

  // Tapping a news item hands the headline to El Guardián for a live read.
  const askGuardian = (headline: string) => {
    setRightTab("news");
    runSignal(headline);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // The VIP-tour hook — a fan taps their artist and El Guardián delivers a
  // live, tailored safety briefing right in the console. This is the funnel:
  // fandom → CyberShield.
  const askForEvent = (e: VipEvent) => {
    const q =
      `I'm going to a ${e.artist} concert. What scams are targeting ${e.artist} fans right now, ` +
      `and how do I keep my tickets, money, and accounts safe?`;
    setShowEvents(false);
    setCenterTab("guardian");
    // Defer the live read so the modal's exit animation finishes first —
    // firing runSignal synchronously re-renders the tree mid-exit and freezes
    // AnimatePresence, leaving an invisible full-screen overlay that traps clicks.
    window.setTimeout(() => {
      runSignal(q);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 280);
  };

  return (
    <div className="min-h-screen w-full lg:h-screen lg:w-screen overflow-y-auto lg:overflow-hidden flex flex-col p-3 gap-2 font-mono"
      style={{
        background: T.bg,
        backgroundImage: [
          `radial-gradient(ellipse 70% 50% at 50% -10%, ${T.royalBlue}38, transparent 70%)`,
          `radial-gradient(ellipse 40% 35% at 12% 110%, ${T.royalLight}1A, transparent 70%)`,
          `radial-gradient(ellipse 40% 35% at 88% 110%, ${T.babyBlue}12, transparent 70%)`,
          `linear-gradient(${T.royalBlue}0A 1px, transparent 1px)`,
          `linear-gradient(90deg, ${T.royalBlue}0A 1px, transparent 1px)`,
        ].join(","),
        backgroundSize: "auto, auto, auto, 50px 50px, 50px 50px",
        color: T.silver,
      }}
    >

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <div className="font-bold text-xs tracking-widest" style={{ color: T.babyBlue }}>PC Digital Solutions</div>
            <div className="text-[12px] tracking-wider" style={{ color: T.silverDim }}>Cyber Defense Systems</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: `${T.royalBlue}25`, border: `1px solid ${T.royalBlue}80` }}>
          <span className="text-xs inline-block">⚽</span>
          <span className="text-[13px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>FIFA WORLD CUP 2026</span>
          <span className="text-[12px] px-1.5 py-0.5 rounded-full font-bold tracking-widest"
            style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, color: GOLD }}>CONCLUDED</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: T.neonGreen, boxShadow: `0 0 6px ${T.neonGreen}` }} />
          <span className="font-bold tracking-widest" style={{ color: T.neonGreen }}>DEFENSE ONLINE</span>
        </div>
      </div>

      {/* ── AFTER-ACTION BANNER — Mission 1 complete; the engine outlives the event ── */}
      {primaryMission && mh && (
        <div className="flex flex-shrink-0 px-2">
          <div className="relative w-full rounded-lg overflow-hidden flex flex-col sm:flex-row items-stretch"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(4,13,26,0.95) 0%, rgba(4,13,26,0.82) 40%, rgba(4,13,26,0.5) 68%, rgba(4,13,26,0.28) 100%), url('/hero-image.PNG')`,
              backgroundSize: "cover",
              backgroundPosition: "center right",
              border: `1px solid ${GOLD}80`,
              boxShadow: `0 0 24px ${T.royalBlue}66, inset 0 0 34px rgba(0,0,0,0.4)`,
            }}>
            {/* gold top accent line */}
            <span className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${GOLD}, ${T.babyBlue} 60%, transparent)` }} />
            {/* mission complete + the proof numbers */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 min-w-0">
              <span className="text-lg flex-shrink-0" style={{ filter: `drop-shadow(0 0 6px ${GOLD}88)` }}>🏆</span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-black tracking-[0.18em]" style={{ color: "#fff", textShadow: `0 0 12px ${GOLD}66` }}>MISSION 1 COMPLETE</span>
                  <span className="text-[11px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
                    style={{ background: `${T.neonGreen}22`, border: `1px solid ${T.neonGreen}66`, color: T.neonGreen }}>WORLD CUP 2026</span>
                </div>
                <span className="text-[12px] tracking-wide mt-0.5 truncate" style={{ color: T.silver }}>
                  {mh.threats_assessed != null && <><span style={{ color: GOLD }}>{mh.threats_assessed.toLocaleString()}</span> threats assessed · </>}
                  {mh.goalie_chat_turns} chats handled · {+(mh.community_intel_hit_rate * 100).toFixed(1)}% community-intel hit rate
                </span>
              </div>
            </div>
            {/* next-mission road — interim proving run → flagship */}
            <div className="hidden md:flex items-center gap-2 px-4 flex-shrink-0" style={{ borderLeft: `1px solid ${GOLD}33` }}>
              <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.silver }}>Next up</span>
              <span className="text-[13px] font-bold tracking-wide whitespace-nowrap" style={{ color: T.babyBlue }}>🏈 Super Bowl LXI</span>
              <span className="text-[12px]" style={{ color: T.silver }}>→</span>
              <span className="text-[13px] font-bold tracking-wide whitespace-nowrap" style={{ color: GOLD, textShadow: `0 0 10px ${GOLD}66` }}>🥇 LA 2028</span>
            </div>
            {/* CTA → after-action archive */}
            <button onClick={() => setShowMissions(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 flex-shrink-0 transition-all hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`, color: "#04101f", boxShadow: `0 0 18px ${T.babyBlue}55` }}>
              <Crosshair className="w-3.5 h-3.5" />
              <span className="text-[13px] font-black tracking-[0.16em] whitespace-nowrap">AFTER-ACTION REPORT</span>
            </button>
          </div>
        </div>
      )}

      {/* ── GRATITUDE BANNER — Raíces Cyber + beta testers, one calm line ── */}
      <div className="flex items-center justify-center flex-shrink-0 px-2">
        <div className="flex items-center gap-2.5 px-3.5 py-1 rounded-full"
          style={{ background: `${GOLD}0C`, border: `1px solid ${GOLD}40` }}>
          <span className="flex items-center bg-white rounded-full px-1.5 py-[2px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/raices_logo.png" alt="Raíces Cyber Organization" style={{ height: 13 }} />
          </span>
          <span className="text-[12px] font-bold tracking-[0.14em]" style={{ color: T.silver }}>
            <span style={{ color: GOLD }}>THANK YOU</span> RAÍCES CYBER
            <span style={{ color: `${T.silverDim}` }}> &amp; </span>
            OUR BETA TESTERS <span style={{ color: GOLD }}>💙</span>
          </span>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">

        {/* LEFT — 240px on desktop, full-width stacked on mobile */}
        <div className="w-full lg:w-[240px] flex-shrink-0 flex flex-col gap-2">

          <Panel className="flex-shrink-0">
            <div className="p-2 flex flex-col gap-1.5">
              {/* Home Base — active HQ tab */}
              <button className="relative w-full flex items-center gap-2.5 px-3 py-2 rounded-sm overflow-hidden transition-all hover:brightness-125"
                style={{
                  background: `linear-gradient(90deg, ${T.babyBlue}2E, ${T.royalBlue}30 70%, transparent)`,
                  border: `1px solid ${T.babyBlue}55`,
                  boxShadow: `0 0 14px ${T.babyBlue}25, inset 0 0 18px ${T.royalBlue}25`,
                }}>
                <span className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ background: T.babyBlue, boxShadow: `0 0 8px ${T.babyBlue}` }} />
                <Home className="w-3.5 h-3.5" style={{ color: T.babyBlue }} />
                <span className="text-[13px] font-bold tracking-[0.22em]" style={{ color: "#fff" }}>HOME BASE</span>
                <span className="ml-auto text-[11px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{ background: `${T.neonGreen}18`, border: `1px solid ${T.neonGreen}45`, color: T.neonGreen }}>HQ</span>
              </button>
              {/* VIP Tour Defense — the next-mission funnel that drives fans in */}
              <motion.button whileHover={{ x: 3 }} onClick={() => setShowEvents(true)}
                className="relative w-full flex items-center gap-2.5 px-3 py-2 rounded-sm overflow-hidden transition-all hover:brightness-125"
                style={{
                  background: `linear-gradient(90deg, ${GOLD}20, ${T.royalBlue}22 70%, transparent)`,
                  border: `1px solid ${GOLD}66`,
                  boxShadow: `0 0 12px ${GOLD}22`,
                }}>
                <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
                <span className="text-[13px]">🎤</span>
                <span className="text-[13px] font-bold tracking-[0.18em]" style={{ color: "#fff" }}>VIP TOUR DEFENSE</span>
                <span className="ml-auto text-[11px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}55`, color: GOLD }}>{VIP_EVENTS.length}</span>
              </motion.button>
            </div>
          </Panel>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {AGENTS.map((agent, i) => {
              const isEngaged = engagedIdx.has(i);
              const isActive = activeAgent === i || isEngaged;
              const liveCount = gateThreatCount(agent.gate);
              return (
              <motion.div key={i}
                whileHover={{ x: 2 }}
                animate={isEngaged
                  ? { boxShadow: [`0 0 2px ${agent.color}30`, `0 0 22px ${agent.color}DD`, `0 0 2px ${agent.color}30`] }
                  : isActive ? { boxShadow: `0 0 16px ${agent.color}50` } : { boxShadow: "0 0 0px #00000000" }}
                transition={isEngaged ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                onClick={() => setActiveAgent(activeAgent === i ? null : i)}
                className="cursor-pointer flex-shrink-0 rounded"
              >
                <Panel>
                  <div className="flex items-center gap-3 px-3 py-3 transition-all"
                    style={{
                      background: isActive ? `linear-gradient(90deg,${agent.color}${isEngaged ? "28" : "18"},transparent)` : "transparent",
                      borderLeft: `3px solid ${isActive ? agent.color : "transparent"}`,
                    }}
                  >
                    <motion.div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                      animate={isEngaged ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={isEngaged ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                      style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}40` }}>
                      <EagleMark size={20} color={agent.color} glow={agent.color} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: T.silver }}>{agent.name}</div>
                      {isEngaged ? (
                        <motion.div className="text-[12px] tracking-widest mt-0.5 font-bold flex items-center gap-1"
                          style={{ color: agent.color }}
                          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          ⚡ ENGAGED · {agent.gate}
                        </motion.div>
                      ) : (
                        <div className="text-[12px] tracking-widest mt-0.5" style={{ color: agent.color }}>● ACTIVE · {agent.gate}</div>
                      )}
                      {/* live threat-load bar */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: `${T.royalBlue}40` }}>
                          <motion.div className="h-full rounded-full"
                            animate={{ width: `${loadedThreatTotal ? (liveCount / loadedThreatTotal) * 100 : 0}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{ background: agent.color, boxShadow: `0 0 6px ${agent.color}` }} />
                        </div>
                        <span className="text-[11px] font-mono flex-shrink-0 w-6 text-right" style={{ color: T.silverDim }}>
                          {loadedThreatTotal ? Math.round((liveCount / loadedThreatTotal) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    {liveCount > 0 ? (
                      <span className="flex-shrink-0 flex flex-col items-center justify-center px-1.5 py-0.5 rounded-md"
                        style={{ background: `${agent.color}1A`, border: `1px solid ${agent.color}50` }}>
                        <span className="text-[14px] font-black font-mono leading-none" style={{ color: agent.color }}>{liveCount}</span>
                        <span className="text-[10px] tracking-wider mt-0.5" style={{ color: T.silverDim }}>LIVE</span>
                      </span>
                    ) : (
                      <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: T.silverDim }} />
                    )}
                  </div>
                </Panel>
              </motion.div>
              );
            })}
          </div>

          {/* Defense status — fills the space below the agents */}
          <Panel className="flex-1 flex flex-col min-h-0">
            <div className="p-3 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <EagleMark size={15} />
                <span className="text-[13px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>DEFENSE STATUS</span>
              </div>
              <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-sm flex-shrink-0"
                style={{ background: `${T.neonGreen}12`, border: `1px solid ${T.neonGreen}33` }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: T.neonGreen, boxShadow: `0 0 6px ${T.neonGreen}` }} />
                <span className="text-[13px] font-bold tracking-wider" style={{ color: T.neonGreen }}>EL GUARDIÁN · ON DUTY</span>
              </div>
              <div className="space-y-2.5 flex-1">
                <StatRow label="Signals Analyzed" value={analyzedCount} color={T.babyBlue} />
                <StatRow label="Live Threats"     value={threatFeed?.active_threats ?? "—"} color="#FF8C42" />
                <StatRow label="Threats Analyzed" value={blockedCount}  color={T.neonGreen} />
                <StatRow label="Gates Online"     value="4 / 4"          color={T.royalLight} />
                <StatRow label="Shield Integrity" value="100%"           color={T.babyBlue} />
              </div>
              <div className="text-[11px] tracking-[0.18em] text-center pt-2 flex-shrink-0" style={{ color: T.silverDim }}>
                PC DIGITAL SOLUTIONS · CNS PHASE III
              </div>
            </div>
          </Panel>
        </div>

        {/* CENTER — flex-1 (min height keeps the console usable when stacked on mobile) */}
        <Panel className="flex flex-col min-w-0 max-lg:h-[560px] lg:flex-1 lg:min-h-0">
          <div className="relative flex flex-col items-center h-full px-4 lg:px-8 py-3 overflow-hidden">

            {/* Stadium pitch motif — center circle + halfway line */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 420, height: 420, border: `1.5px solid ${T.babyBlue}0E` }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 8, height: 8, background: `${T.babyBlue}18` }} />
              <div className="absolute left-0 right-0 top-1/2" style={{ borderTop: `1.5px solid ${T.babyBlue}0A` }} />
            </div>

            {/* Center tab switch — El Guardián console vs Goalie chat */}
            <div className="relative z-10 w-full max-w-[680px] flex-shrink-0 grid grid-cols-2 gap-1 p-1 rounded-lg mb-2"
              style={{ background: T.panel, border: `1px solid ${T.royalBlue}55` }}>
              {([["guardian", "EL GUARDIÁN"], ["goalie", "GOALIE CHAT"]] as const).map(([key, label]) => {
                const active = centerTab === key;
                const markColor = active ? "#04101f" : T.silverDim;
                return (
                  <button key={key} onClick={() => setCenterTab(key)}
                    className="py-1.5 rounded-md text-[13px] font-bold tracking-[0.16em] transition-all flex items-center justify-center gap-1.5"
                    style={active
                      ? { background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`, color: "#04101f", boxShadow: `0 0 14px ${T.babyBlue}45` }
                      : { color: T.silverDim }}>
                    <EagleMark size={13} color={markColor} glow={active ? "#04101f" : T.babyBlue} />
                    {label}
                    {key === "goalie" && !active && (
                      <span className="ml-0.5 text-[11px] font-bold px-1 py-0.5 rounded-full"
                        style={{ background: `${GOLD}20`, color: GOLD }}>BETA</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* El Guardián interactive console — compact, live, modern */}
            <div className={`relative z-10 w-full max-w-[680px] flex-1 min-h-0 overflow-y-auto cs-scroll flex-col ${centerTab === "guardian" ? "flex" : "hidden"}`}>

              {/* Hero — Eagle Eye + identity + live posture */}
              <div className="flex flex-col items-center mb-3">
                <div className="-my-1" style={{ transform: "scale(0.95)", transformOrigin: "center" }}>
                  <EagleEye />
                </div>
                <h1 className="text-lg font-black tracking-[0.16em] mt-1" style={{ color: "#fff" }}>
                  CYBERSHIELD <span style={{ color: T.babyBlue }}>AI</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-[12px] tracking-[0.24em] font-bold" style={{ color: T.babyBlue }}>EL GUARDIÁN · WORLD CUP 2026 DEFENSE</p>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${posture.color}15`, border: `1px solid ${posture.color}55`, color: posture.color }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: posture.color }} />
                    {posture.label}
                  </span>
                </div>
              </div>

              {/* Primary action — the one clear thing to do on arrival */}
              <p className="text-center text-[14px] leading-relaxed mb-3 px-4" style={{ color: T.silver }}>
                Something feel off? Drop the link, message, or offer here. El Guardián reads it
                in seconds and gives you a clear, plain-language verdict.
                <span style={{ color: T.silverDim }}> New here? Tap an example to see it work.</span>
              </p>

              {/* Quick-ask chips — the guided entry point, promoted above the stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {QUICK_ASKS.map(c => (
                  <button key={c.label} onClick={() => runSignal(c.q)} disabled={loading}
                    className="text-[13px] font-semibold text-center px-3 py-2 rounded-lg transition-transform hover:scale-[1.03] disabled:opacity-50"
                    style={{ background: `${T.babyBlue}12`, border: `1px solid ${T.babyBlue}40`, color: T.babyBlue }}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Live stats — secondary context, quieter and demoted below the action */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "ACTIVE THREATS", value: threatFeed?.active_threats ?? "—", color: "#FF8C42" },
                  { label: "GATES ONLINE",   value: "4 / 4",                          color: T.neonGreen },
                  { label: "SIGNALS SCANNED", value: threatFeed?.total_seen ?? "—",   color: T.babyBlue },
                ].map(s => (
                  <div key={s.label} className="rounded-lg px-3 py-2 text-center"
                    style={{ background: `${T.royalBlue}12`, border: `1px solid ${T.royalBlue}30` }}>
                    <div className="text-base font-black font-mono leading-none" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[11px] tracking-[0.12em] mt-1" style={{ color: T.silverDim }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Conversation */}
              <Panel className="flex flex-col">
                <div className="p-3.5 flex flex-col">
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <EagleMark size={13} />
                    <span className="text-[12px] tracking-[0.3em] font-bold" style={{ color: T.babyBlue }}>EL GUARDIÁN</span>
                  </div>
                  {query && (
                    <div className="mb-2 flex-shrink-0 flex items-start gap-2 px-2.5 py-1.5 rounded-md"
                      style={{ background: `${T.royalBlue}1A`, border: `1px solid ${T.royalBlue}40` }}>
                      <span className="text-[11px] font-bold tracking-[0.2em] mt-0.5 flex-shrink-0" style={{ color: T.silverDim }}>YOU ▸</span>
                      <span className="text-[13px] leading-snug break-words" style={{ color: T.silver }}>{query}</span>
                    </div>
                  )}
                  <div className="max-h-[320px] overflow-y-auto min-h-0 pr-1 cs-scroll">
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs" style={{ color: T.silverDim }}>
                          <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: T.babyBlue, borderTopColor: "transparent" }} />
                          El Guardián is analyzing…
                        </motion.div>
                      ) : (
                        <motion.div key="resp" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          {agentReports.length > 0
                            ? <RichText text={stripSignature(response)} />
                            : <RichText text={response} />}
                          {agentReports.map((r, i) => {
                            const a = AGENTS[GATE_TO_INDEX[r.gate]];
                            if (!a) return null;
                            const isLast = i === agentReports.length - 1;
                            const cleanText = isLast ? r.response : stripSignature(r.response);
                            return (
                              <motion.div key={r.gate}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 * (i + 1) }}
                                className="mt-4 pl-3" style={{ borderLeft: `2px solid ${a.color}` }}>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <EagleMark size={14} color={a.color} glow={a.color} />
                                  <span className="text-[12px] tracking-[0.25em] font-bold" style={{ color: a.color }}>
                                    {r.agent.toUpperCase()} · {r.gate.toUpperCase()}
                                  </span>
                                  <span className="text-[11px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest"
                                    style={{ background: `${a.color}18`, border: `1px solid ${a.color}40`, color: a.color }}>
                                    REPORTING
                                  </span>
                                </div>
                                <RichText text={cleanText} />
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Panel>

              {/* Input */}
              {attached && (
                <div className="w-full mt-2.5 flex-shrink-0">
                  <FileChip file={attached} onClear={() => setAttached(null)} />
                </div>
              )}
              <div className="w-full mt-2.5 flex gap-2 items-stretch flex-shrink-0">
                <AttachButton onPick={onPickFile} disabled={loading} />
                <div className="flex-1 relative">
                  <textarea value={input} rows={2}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleActivate(); }
                    }}
                    placeholder={attached ? "Add a note (optional), then Activate Shield…" : "Drop a suspicious link, message, or anything that feels off…"}
                    className="w-full px-4 py-2.5 text-xs outline-none rounded-lg resize-none leading-relaxed transition-all cs-scroll"
                    style={{
                      background: "#08121f",
                      border: `1px solid ${T.babyBlue}55`,
                      color: T.silver,
                      boxShadow: `inset 0 0 14px ${T.royalBlue}35, 0 0 16px ${T.babyBlue}1A`,
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = T.babyBlue;
                      e.target.style.boxShadow = `inset 0 0 14px ${T.royalBlue}30, 0 0 24px ${T.babyBlue}4D`;
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = `${T.babyBlue}55`;
                      e.target.style.boxShadow = `inset 0 0 14px ${T.royalBlue}35, 0 0 16px ${T.babyBlue}1A`;
                    }}
                  />
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleActivate} disabled={loading}
                  className="flex items-center justify-center px-6 text-[13px] font-bold tracking-[0.18em] rounded-lg disabled:opacity-60 flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`, color: "#050d18", boxShadow: `0 0 20px ${T.babyBlue}50` }}
                >
                  ACTIVATE SHIELD
                </motion.button>
              </div>

            </div>

            <GoalieZone active={centerTab === "goalie"} />
          </div>
        </Panel>

        {/* RIGHT — tabbed: table · fixtures · news (one at a time, room to breathe) */}
        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-2 min-h-0">

          {/* Segmented tab control */}
          <div className="flex-shrink-0 grid grid-cols-3 gap-1 p-1 rounded-lg"
            style={{ background: T.panel, border: `1px solid ${T.royalBlue}55` }}>
            {([["standings", "Pillars"], ["fixtures", "Company"], ["news", "Threats"]] as const).map(([key, label]) => {
              const active = rightTab === key;
              return (
                <button key={key} onClick={() => setRightTab(key)}
                  className="py-2 rounded-md text-[13px] font-bold tracking-[0.16em] transition-all"
                  style={active
                    ? { background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`, color: "#04101f", boxShadow: `0 0 14px ${T.babyBlue}45` }
                    : { color: T.silverDim }}>
                  {label.toUpperCase()}
                  {key === "news" && threatFeed && threatFeed.active_threats > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center text-[11px] font-bold px-1 rounded-full"
                      style={{ background: active ? "#04101f30" : "#FF3B3B22", color: active ? "#04101f" : "#FF8C42" }}>
                      {threatFeed.active_threats}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          <Panel className="flex flex-col max-lg:h-[460px] lg:flex-1 lg:min-h-0" glow>
            <div className="p-4 flex flex-col h-full min-h-0">

              {/* ── PILLARS · Strength / Vigilance / Intelligence ── */}
              {rightTab === "standings" && (
                <>
                  <div className="flex items-center justify-between mb-2.5 flex-shrink-0">
                    <span className="text-[13px] font-bold tracking-[0.18em]" style={{ color: "#fff" }}>OUR PILLARS</span>
                    <span className="text-[11px] tracking-[0.16em]" style={{ color: T.silverDim }}>PC DIGITAL SOLUTIONS</span>
                  </div>

                  {/* three values, each with a live signal */}
                  <div className="flex flex-col gap-1.5 mb-3 flex-shrink-0">
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: `${GOLD}0E`, border: `1px solid ${GOLD}33` }}>
                      <span className="text-sm">💪</span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-bold tracking-[0.14em]" style={{ color: GOLD }}>STRENGTH</span>
                        <span className="text-[12px] leading-tight" style={{ color: T.silver }}>Defense that holds — one mission proven.</span>
                      </div>
                      <span className="text-[13px] font-mono font-bold" style={{ color: GOLD }}>{mh?.threats_assessed?.toLocaleString() ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: `${T.neonGreen}0E`, border: `1px solid ${T.neonGreen}33` }}>
                      <span className="text-sm">🛡️</span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-bold tracking-[0.14em]" style={{ color: T.neonGreen }}>VIGILANCE</span>
                        <span className="text-[12px] leading-tight" style={{ color: T.silver }}>Always watching the wire, live.</span>
                      </div>
                      <span className="text-[13px] font-mono font-bold" style={{ color: T.neonGreen }}>{threatFeed?.total_seen ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: `${T.babyBlue}0E`, border: `1px solid ${T.babyBlue}33` }}>
                      <span className="text-sm">🧠</span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-bold tracking-[0.14em]" style={{ color: T.babyBlue }}>INTELLIGENCE</span>
                        <span className="text-[12px] leading-tight" style={{ color: T.silver }}>Ahead of a fast-moving field.</span>
                      </div>
                      <span className="text-[13px] font-mono font-bold" style={{ color: T.babyBlue }}>{intel?.count ?? "—"}</span>
                    </div>
                  </div>

                  {/* live cyber + AI intelligence feed */}
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <span className="text-[12px] font-bold tracking-[0.2em]" style={{ color: T.babyBlue }}>INTELLIGENCE FEED</span>
                    <span className="flex items-center gap-1 text-[11px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
                      style={{ background: `${T.neonGreen}18`, border: `1px solid ${T.neonGreen}50`, color: T.neonGreen }}>
                      <motion.span className="w-1 h-1 rounded-full inline-block" style={{ background: T.neonGreen }}
                        animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                      LIVE
                    </span>
                    <span className="ml-auto text-[11px] tracking-wider" style={{ color: T.silverDim }}>CYBER · AI</span>
                  </div>
                  {intel && intel.items.length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1 cs-scroll space-y-1.5 min-h-0">
                      {intel.items.map((it, i) => {
                        const c = it.kind === "ai" ? T.babyBlue : "#FF8C42";
                        return (
                          <a key={i} href={it.link} target="_blank" rel="noopener noreferrer"
                            className="block rounded-lg p-2 transition-colors hover:bg-white/5"
                            style={{ background: `${T.royalBlue}14`, border: `1px solid ${T.royalBlue}40` }}>
                            <div className="flex items-start gap-2">
                              <span className="text-[11px] font-bold tracking-wider px-1 py-0.5 rounded flex-shrink-0 mt-0.5"
                                style={{ background: `${c}1F`, border: `1px solid ${c}55`, color: c }}>{it.kind === "ai" ? "AI" : "CYBER"}</span>
                              <span className="text-[13px] leading-snug flex-1" style={{ color: "#E6EDF3" }}>{it.title}</span>
                            </div>
                            <div className="text-[11px] mt-1 tracking-wide truncate" style={{ color: T.silverDim }}>{it.source}</div>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[13px]" style={{ color: T.silverDim }}>{intel ? "Feed quiet right now." : "Loading live intelligence…"}</div>
                  )}
                </>
              )}

              {/* ── PC DIGITAL SOLUTIONS · company spotlight ── */}
              {rightTab === "fixtures" && (
                <>
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <span className="text-[13px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>PC DIGITAL SOLUTIONS</span>
                    <span className="text-[11px] tracking-[0.16em]" style={{ color: T.silverDim }}>BY ACP</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 cs-scroll space-y-2.5 min-h-0">

                    {/* brand statement */}
                    <div className="rounded-lg p-3" style={{ background: `linear-gradient(135deg, ${T.royalBlue}33, ${T.panel})`, border: `1px solid ${T.babyBlue}44` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <EagleMark size={16} />
                        <span className="text-[13px] font-black tracking-wide" style={{ color: "#fff" }}>Cyber defense, built for people.</span>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: T.silver }}>
                        AI security tools that protect the communities enterprise security overlooks —
                        multilingual, community-trained, and honest about what they do. CyberShield is the proof.
                      </p>
                    </div>

                    {/* current product */}
                    <div className="rounded-lg p-2.5" style={{ background: `${T.neonGreen}0C`, border: `1px solid ${T.neonGreen}33` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{ background: `${T.neonGreen}18`, border: `1px solid ${T.neonGreen}55`, color: T.neonGreen }}>LIVE</span>
                        <span className="text-[13px] font-bold" style={{ color: "#fff" }}>CyberShield AI</span>
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: T.silver }}>
                        Community-trained scam defense. Mission 1 — World Cup 2026 — complete; Super Bowl LXI up next.
                      </p>
                    </div>

                    {/* future product */}
                    <div className="rounded-lg p-2.5" style={{ background: `${GOLD}0C`, border: `1px dashed ${GOLD}55` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}55`, color: GOLD }}>COMING SOON</span>
                        <span className="text-[13px] font-bold" style={{ color: "#fff" }}>CyberShield Enterprise</span>
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: T.silver }}>
                        The same engine, scaled for teams — agentic threat triage, identity &amp; secrets guardrails,
                        and multilingual security operations.
                      </p>
                    </div>

                    {/* CTA */}
                    <a href="https://github.com/PC-DigitalSolutions" target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg py-2.5 transition-transform hover:scale-[1.02]"
                      style={{ background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`, color: "#04101f", boxShadow: `0 0 16px ${T.babyBlue}45` }}>
                      <span className="text-[13px] font-black tracking-[0.14em]">VIEW OUR WORK ON GITHUB ↗</span>
                    </a>
                    <div className="text-center text-[11px] tracking-[0.18em] pt-0.5" style={{ color: T.silverDim }}>
                      STRENGTH · VIGILANCE · INTELLIGENCE
                    </div>
                  </div>
                </>
              )}

              {/* ── NEWS ── */}
              {rightTab === "news" && (
                <>
                  <div className="flex items-center justify-between mb-1 flex-shrink-0">
                    <span className="flex items-center gap-2 text-[13px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>
                      <span className="text-[15px] leading-none">🌐</span>
                      LIVE THREAT MONITOR
                    </span>
                  </div>
                  <div className="text-[12px] tracking-[0.14em] mb-3 flex-shrink-0" style={{ color: T.silverDim }}>
                    {threatFeed ? `LIVE · GOOGLE NEWS · ${threatFeed.total_seen} SCANNED` : "CONNECTING…"}
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 cs-scroll space-y-3 min-h-0">
                    {threatFeed?.threats?.length ? threatFeed.threats.map(t => {
                      const isThreat = t.kind === "threat";
                      const c = isThreat ? (SEVERITY_COLOR[t.severity] ?? T.babyBlue) : T.babyBlue;
                      return (
                        <motion.div key={t.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg p-3" style={{ background: `${T.royalBlue}18`, borderLeft: `3px solid ${c}` }}>
                          {/* tag row */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[11px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm"
                              style={{ background: `${c}1F`, border: `1px solid ${c}55`, color: c }}>
                              {isThreat ? t.severity : "NEWS"}
                            </span>
                            <span className="text-[12px] font-semibold tracking-wide truncate" style={{ color: c }}>{t.agent}</span>
                            <span className="ml-auto text-[12px] flex-shrink-0" style={{ color: T.silverDim }}>{timeAgo(t.ts)}</span>
                          </div>
                          {/* headline */}
                          <div className="text-[14px] leading-relaxed mb-1" style={{ color: "#E6EDF3" }}>{t.title}</div>
                          <div className="text-[12px] mb-2 truncate" style={{ color: T.silverDim }}>{t.source || "Threat wire"}</div>
                          {/* recommendation */}
                          {t.recommendation && (
                            <div className="flex items-start gap-2 rounded-md p-2 mb-2"
                              style={{ background: `${c}12`, border: `1px solid ${c}33` }}>
                              <span className="mt-0.5 flex-shrink-0"><EagleMark size={13} color={c} glow="#00000000" /></span>
                              <span className="text-[13px] leading-snug" style={{ color: T.silver }}>
                                <span className="font-bold" style={{ color: c }}>El Guardián: </span>{t.recommendation}
                              </span>
                            </div>
                          )}
                          {/* actions */}
                          <div className="flex items-center gap-2">
                            <button onClick={() => askGuardian(t.title)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[12px] font-bold tracking-[0.16em] transition-transform hover:scale-[1.02]"
                              style={{ background: c, color: "#04101f", boxShadow: `0 0 12px ${c}55` }}>
                              <EagleMark size={13} color="#04101f" glow="#00000000" />
                              ASK EL GUARDIÁN
                            </button>
                            <a href={t.link} target="_blank" rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-md text-[12px] font-bold tracking-wide transition-colors hover:bg-white/5"
                              style={{ border: `1px solid ${T.neonGreen}60`, color: T.neonGreen }}>
                              READ ↗
                            </a>
                          </div>
                        </motion.div>
                      );
                    }) : (
                      <div className="text-[13px]" style={{ color: T.silverDim }}>Scanning live threat feeds…</div>
                    )}
                  </div>
                </>
              )}

            </div>
          </Panel>

        </div>
      </div>

      {/* footer — World Cup ticker + beta feedback button */}
      <div className="flex items-center gap-3 flex-shrink-0 py-1 pr-1"
        style={{ borderTop: `1px solid ${T.royalBlue}40` }}>
        <div className="relative overflow-hidden flex-1 min-w-0">
          <div className="cs-ticker flex w-max whitespace-nowrap text-[12px] tracking-[0.25em]" style={{ color: T.silverDim }}>
            {[0, 1].map(k => (
              <span key={k} className="flex items-center">
                {[
                  "MISSION 1 COMPLETE", "FIFA WORLD CUP 2026 · JUN 11 — JUL 19",
                  "NEXT MISSION · SUPER BOWL LXI · FEB 2027", "ROAD TO LA 2028 OLYMPICS",
                  "48 TEAMS", "104 MATCHES", "16 HOST CITIES",
                  "ATLANTA", "BOSTON", "DALLAS", "GUADALAJARA", "HOUSTON", "KANSAS CITY", "LOS ANGELES",
                  "MEXICO CITY", "MIAMI", "MONTERREY", "NEW YORK / NEW JERSEY", "PHILADELPHIA",
                  "SAN FRANCISCO", "SEATTLE", "TORONTO", "VANCOUVER",
                  "PROTECTED BY CYBERSHIELD AI — EL GUARDIÁN", "PC DIGITAL SOLUTIONS",
                  "THANK YOU RAÍCES CYBER ORGANIZATION 💙", "GRACIAS A NUESTROS BETA TESTERS 🙌",
                ].map((item, i) => (
                  <span key={i} className="flex items-center">
                    <span className="px-3">{item}</span>
                    <span style={{ color: T.babyBlue }}>⚽</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* Beta tester feedback — standalone call to action */}
        <motion.a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer"
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-black tracking-[0.18em]"
          style={{
            background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`,
            color: "#04101f",
            boxShadow: `0 0 16px ${T.babyBlue}50`,
          }}>
          <EagleMark size={14} color="#04101f" glow="#04101f" />
          GIVE FEEDBACK ↗
        </motion.a>
      </div>

      <CompletedMissions open={showMissions} onClose={() => setShowMissions(false)} />
      <VipTours open={showEvents} onClose={() => setShowEvents(false)} onAsk={askForEvent} />
    </div>
  );
}
