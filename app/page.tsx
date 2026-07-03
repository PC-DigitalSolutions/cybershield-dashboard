"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, Home, Crosshair, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RichText from "./components/RichText";

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

type GoalieTurn = { role: "user" | "model"; text: string; matches?: number };
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
  "In the box and ready. Romance scams, dating apps, fake sugar daddies, sketchy tickets, weird texts — paste whatever feels off, any language, cualquier idioma. **Zero judgment in my box.** Nothing gets past me. 🧤";

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

function kickoffLabel(utcDate: string | null): string {
  if (!utcDate) return "TBD";
  const d = new Date(utcDate);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  if (sameDay) return `TODAY ${time}`;
  const day = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  return `${day} ${time}`;
}

const GATE_TO_INDEX: Record<string, number> = { "Gate A": 0, "Gate B": 1, "Gate C": 2, "Gate D": 3 };

const SIG_STRIP = /(?:^|\n).*(?:Strength[.\s]*Vigilance[.\s]*Intelligence|CyberShield AI\s*[—–-]\s*El Guardi[áa]n).*$/gis;
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

function Corner({ className = "" }: { className?: string }) {
  return <span className={`absolute w-3 h-3 ${className}`} />;
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
      <span className="text-[10px]" style={{ color: T.silverDim }}>{label}</span>
      <span className="text-[13px] font-bold font-mono" style={{ color, textShadow: `0 0 8px ${color}40` }}>{value}</span>
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
  const [feed, setFeed] = useState<StoryFeed | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyType, setStoryType] = useState("tickets");
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [contributorNum, setContributorNum] = useState<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!text || sending) return;
    const history = turns.map(t => ({ role: t.role, text: t.text }));
    setTurns(t => [...t, { role: "user", text }]);
    setMsg("");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/goalie/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
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
        <span className="text-[11px] font-black tracking-[0.2em]" style={{ color: "#fff" }}>ANTI-SCAMMER GOALIE</span>
        <span className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
          style={{ background: `${T.babyBlue}15`, border: `1px solid ${T.babyBlue}50`, color: T.babyBlue }}>GATE A</span>
        <span className="ml-auto text-[8px] tracking-[0.14em]" style={{ color: T.silverDim }}>
          {feed ? `🛡️ ${feed.total} COMMUNITY REPORTS · ${feed.this_week} THIS WEEK` : "CONNECTING…"}
        </span>
      </div>

      {/* Community mission — why the wall exists, who trains the Goalie */}
      <div className="flex-shrink-0 px-3 py-1.5 rounded-md flex items-center gap-2"
        style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}35` }}>
        <span className="text-[10px] flex-shrink-0">🤝</span>
        <span className="text-[8.5px] leading-relaxed" style={{ color: T.silver }}>
          <span className="font-bold" style={{ color: GOLD }}>COMMUNITY MISSION · </span>
          Every story shared by the <span className="font-bold" style={{ color: "#fff" }}>Raíces Cyber community</span> and
          our <span className="font-bold" style={{ color: "#fff" }}>beta testers</span> trains
          the Goalie — every scam counts: romance, dating apps, fake sugar daddies, tickets, texts.
          World Cup or everyday life. <span style={{ color: GOLD }}>Tu historia protege a la próxima familia. 💙</span>
        </span>
      </div>

      {/* Chat window — min height guarantees the chat never gets crushed by the wall */}
      <Panel className="flex-1 flex flex-col min-h-[200px]">
        <div className="h-full flex flex-col min-h-0">
        <div className="relative flex-1 min-h-0">
        <div ref={scrollRef} onScroll={onChatScroll} className="absolute inset-0 overflow-y-auto cs-scroll p-3.5 space-y-2.5">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] px-3 py-2 rounded-lg rounded-br-sm text-[11px] leading-relaxed break-words"
                  style={{ background: `${T.royalBlue}55`, border: `1px solid ${T.royalBlue}`, color: "#E3F2FD" }}>
                  {t.text}
                </div>
              </div>
            ) : (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 rounded-lg rounded-bl-sm"
                  style={{ background: `${T.babyBlue}0D`, border: `1px solid ${T.babyBlue}35` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px]">🥅</span>
                    <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: T.babyBlue }}>GOALIE</span>
                    {(t.matches ?? 0) > 0 && (
                      <span className="text-[7px] font-bold tracking-wider px-1.5 py-0.5 rounded-full"
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
            <div className="flex items-center gap-2 text-[10px]" style={{ color: T.silverDim }}>
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: T.babyBlue, borderTopColor: "transparent" }} />
              The Goalie is reading the play…
            </div>
          )}
        </div>

        {/* Jump-to-latest — shows whenever the chat is scrolled up */}
        <AnimatePresence>
          {!atBottom && (
            <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              onClick={scrollToBottom}
              className="absolute bottom-2 right-3 z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-bold tracking-wider"
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
                  className="text-[9px] font-semibold text-center px-2 py-1.5 rounded-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: `${T.babyBlue}10`, border: `1px solid ${T.babyBlue}35`, color: T.babyBlue }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-stretch">
            <textarea value={msg} rows={2}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Paste the suspicious message here… / Pega aquí el mensaje sospechoso…"
              className="flex-1 px-3 py-2 text-[11px] outline-none rounded-lg resize-none leading-relaxed cs-scroll"
              style={{ background: "#08121f", border: `1px solid ${T.babyBlue}45`, color: T.silver }}
            />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => send()} disabled={sending}
              className="px-4 text-[10px] font-bold tracking-[0.16em] rounded-lg disabled:opacity-60 flex-shrink-0"
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
              <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: GOLD }}>🛡️ ADD YOUR STORY TO THE COMMUNITY WALL</span>
              <button onClick={() => { setShowReport(false); setSubmitState("idle"); }}
                className="ml-auto text-[9px] px-2 py-0.5 rounded hover:bg-white/5" style={{ color: T.silverDim }}>✕ CLOSE</button>
            </div>
            {submitState === "done" ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-3 rounded-lg text-center"
                style={{ background: `linear-gradient(135deg, ${GOLD}14, ${T.babyBlue}0E)`, border: `1px solid ${GOLD}55`, boxShadow: `0 0 24px ${GOLD}20` }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                  className="text-xl mb-1">🧤</motion.div>
                <div className="text-[10px] font-black tracking-[0.24em] mb-2" style={{ color: GOLD }}>
                  THE GOALIE&apos;S PROMISE
                </div>
                <div className="space-y-1 mb-2">
                  {GOALIE_MANIFESTO.map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.35 }}
                      className="text-[10px] leading-relaxed" style={{ color: "#E3F2FD" }}>
                      {line}
                    </motion.div>
                  ))}
                </div>
                {contributorNum && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
                    className="text-[9px] font-bold tracking-[0.18em] mb-1.5" style={{ color: T.babyBlue }}>
                    ⭐ DEFENDER #{contributorNum} ON THE COMMUNITY WALL ⭐
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1 }}
                  className="text-[9.5px] font-bold" style={{ color: GOLD }}>
                  Gracias. De verdad — mil gracias. 💙 You make the shield stronger.
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}
                  className="text-[8px] tracking-wider mt-1.5" style={{ color: T.silverDim }}>
                  — THE ANTI-SCAMMER GOALIE · WITH RAÍCES CYBER &amp; OUR BETA TESTERS
                </motion.div>
                <button onClick={() => { setShowReport(false); setSubmitState("idle"); }}
                  className="mt-2 px-3 py-1 text-[9px] font-bold tracking-[0.14em] rounded-md transition-transform hover:scale-[1.03]"
                  style={{ background: `${T.babyBlue}15`, border: `1px solid ${T.babyBlue}50`, color: T.babyBlue }}>
                  BACK TO THE WALL
                </button>
              </motion.div>
            ) : (
              <>
                <textarea value={storyText} rows={3}
                  onChange={e => setStoryText(e.target.value)}
                  placeholder="What happened? No names needed — emails and phone numbers are scrubbed automatically. / ¿Qué pasó? Sin nombres — correos y teléfonos se borran automáticamente."
                  className="w-full px-3 py-2 text-[11px] outline-none rounded-lg resize-none leading-relaxed cs-scroll"
                  style={{ background: "#08121f", border: `1px solid ${GOLD}45`, color: T.silver }} />
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={storyType} onChange={e => setStoryType(e.target.value)}
                    className="px-2 py-1.5 text-[10px] rounded-md outline-none"
                    style={{ background: "#08121f", border: `1px solid ${T.royalBlue}80`, color: T.silver }}>
                    {(feed?.scam_types ?? Object.keys(SCAM_TYPE_META)).map(t => (
                      <option key={t} value={t}>{SCAM_TYPE_META[t]?.icon ?? "⚠️"} {SCAM_TYPE_META[t]?.label ?? t}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-[9px] cursor-pointer" style={{ color: T.silver }}>
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                    Share anonymously with the community
                  </label>
                  <button onClick={submitStory}
                    disabled={!consent || storyText.trim().length < 20 || submitState === "sending"}
                    className="ml-auto px-3 py-1.5 text-[9px] font-bold tracking-[0.14em] rounded-md disabled:opacity-40"
                    style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, color: GOLD }}>
                    {submitState === "sending" ? "SAVING…" : "SUBMIT STORY"}
                  </button>
                </div>
                {submitState === "error" && (
                  <div className="text-[9px]" style={{ color: "#FF8C42" }}>🧤 {submitError}</div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: GOLD }}>🛡️ COMMUNITY SCAM WALL</span>
              <span className="text-[8px] tracking-wider" style={{ color: T.silverDim }}>
                REAL REPORTS · TRAINING THE GOALIE
              </span>
              <button onClick={() => setShowReport(true)}
                className="ml-auto px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] rounded-md transition-transform hover:scale-[1.03]"
                style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}55`, color: GOLD }}>
                ➕ ADD MY STORY
              </button>
            </div>
            <div className="max-h-[96px] overflow-y-auto cs-scroll space-y-1.5 pr-1">
              {feed?.stories?.length ? feed.stories.map(s => (
                <div key={s.id} className="flex items-start gap-2 px-2 py-1.5 rounded-md"
                  style={{ background: `${T.royalBlue}14`, border: `1px solid ${T.royalBlue}35` }}>
                  <span className="text-[10px] flex-shrink-0">{SCAM_TYPE_META[s.scam_type]?.icon ?? "⚠️"}</span>
                  <span className="text-[10px] leading-snug break-words flex-1" style={{ color: T.silver }}>{s.story}</span>
                  <span className="text-[7px] flex-shrink-0 mt-0.5" style={{ color: T.silverDim }}>{timeAgo(s.created)}</span>
                </div>
              )) : (
                <div className="text-[10px]" style={{ color: T.silverDim }}>Loading community reports…</div>
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function CyberShieldCommandCenter() {
  const [input, setInput]     = useState("");
  const [query, setQuery]     = useState("");
  const [response, setResponse] = useState(
    "El Guardián is ready to tackle any breach with knowledge, defense plays, and ways to keep you safe during the FIFA World Cup 2026!!"
  );
  const [loading, setLoading]   = useState(false);
  const [activeAgent, setActiveAgent] = useState<number | null>(null);
  const [agentReports, setAgentReports] = useState<AgentReport[]>([]);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [matchFeed, setMatchFeed] = useState<MatchFeed | null>(null);
  const [threatFeed, setThreatFeed] = useState<ThreatFeed | null>(null);
  const [rightTab, setRightTab] = useState<"standings" | "fixtures" | "news">("news");
  const [centerTab, setCenterTab] = useState<"guardian" | "goalie">("guardian");

  useEffect(() => {
    const load = () =>
      fetch(`${API_BASE}/matches`)
        .then(r => r.json())
        .then(setMatchFeed)
        .catch(() => setMatchFeed(null));
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

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

  const liveMatch = matchFeed?.source === "live" && matchFeed.live?.length ? matchFeed.live[0] : null;
  const upcoming = matchFeed?.source === "live" && matchFeed.upcoming?.length ? matchFeed.upcoming : null;
  const standings = matchFeed?.source === "live" && matchFeed.standings?.length ? matchFeed.standings : null;
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
    const signal = raw.trim() || "Global shield activation — scan all FIFA venues.";
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

  const handleActivate = () => runSignal(input);

  // Tapping a news item hands the headline to El Guardián for a live read.
  const askGuardian = (headline: string) => {
    setRightTab("news");
    runSignal(headline);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col p-3 gap-2 font-mono"
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
      <div className="flex items-center justify-between px-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <div className="font-bold text-xs tracking-widest" style={{ color: T.babyBlue }}>PC Digital Solutions</div>
            <div className="text-[9px] tracking-wider" style={{ color: T.silverDim }}>Cyber Defense Systems</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: `${T.royalBlue}25`, border: `1px solid ${T.royalBlue}80` }}>
          <motion.span className="text-xs inline-block"
            animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>⚽</motion.span>
          <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>FIFA WORLD CUP 2026</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-widest animate-pulse"
            style={{ background: `${T.neonGreen}20`, border: `1px solid ${T.neonGreen}60`, color: T.neonGreen }}>LIVE</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.neonGreen, boxShadow: `0 0 6px ${T.neonGreen}` }} />
          <span className="font-bold tracking-widest" style={{ color: T.neonGreen }}>ALL SYSTEMS ACTIVE</span>
        </div>
      </div>

      {/* ── GRATITUDE BANNERS — Raíces Cyber + beta testers ── */}
      <div className="flex items-center justify-center gap-2 flex-shrink-0 flex-wrap px-2">
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}50`, boxShadow: `0 0 14px ${GOLD}18` }}>
          <span className="flex items-center bg-white rounded-full px-2 py-[3px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/raices_logo.png" alt="Raíces Cyber Organization" style={{ height: 15 }} />
          </span>
          <span className="text-[9px] font-bold tracking-[0.16em]" style={{ color: GOLD }}>
            THANK YOU <span style={{ color: "#fff" }}>RAÍCES CYBER ORGANIZATION</span> · COMMUNITY PARTNER 💙
          </span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: `${T.babyBlue}0E`, border: `1px solid ${T.babyBlue}45` }}>
          <span className="text-[10px]">🙌</span>
          <span className="text-[9px] font-bold tracking-[0.16em]" style={{ color: T.babyBlue }}>
            GRACIAS A NUESTROS <span style={{ color: "#fff" }}>BETA TESTERS</span> — YOU MAKE THE SHIELD STRONGER
          </span>
        </motion.div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* LEFT — 240px */}
        <div className="w-[240px] flex-shrink-0 flex flex-col gap-2">

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
                <span className="text-[11px] font-bold tracking-[0.22em]" style={{ color: "#fff" }}>HOME BASE</span>
                <span className="ml-auto text-[7px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{ background: `${T.neonGreen}18`, border: `1px solid ${T.neonGreen}45`, color: T.neonGreen }}>HQ</span>
              </button>
              {/* Mission Selector — secondary targeting style */}
              <motion.button whileHover={{ x: 3 }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm transition-colors hover:bg-white/5"
                style={{ border: `1px dashed ${T.royalLight}66` }}>
                <Crosshair className="w-3.5 h-3.5" style={{ color: T.royalLight }} />
                <span className="text-[11px] tracking-[0.22em]" style={{ color: T.silver }}>MISSION SELECTOR</span>
                <ChevronRight className="ml-auto w-3 h-3" style={{ color: T.silverDim }} />
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
                        <motion.div className="text-[9px] tracking-widest mt-0.5 font-bold flex items-center gap-1"
                          style={{ color: agent.color }}
                          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          ⚡ ENGAGED · {agent.gate}
                        </motion.div>
                      ) : (
                        <div className="text-[9px] tracking-widest mt-0.5" style={{ color: agent.color }}>● ACTIVE · {agent.gate}</div>
                      )}
                      {/* live threat-load bar */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: `${T.royalBlue}40` }}>
                          <motion.div className="h-full rounded-full"
                            animate={{ width: `${loadedThreatTotal ? (liveCount / loadedThreatTotal) * 100 : 0}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{ background: agent.color, boxShadow: `0 0 6px ${agent.color}` }} />
                        </div>
                        <span className="text-[7px] font-mono flex-shrink-0 w-6 text-right" style={{ color: T.silverDim }}>
                          {loadedThreatTotal ? Math.round((liveCount / loadedThreatTotal) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    {liveCount > 0 ? (
                      <span className="flex-shrink-0 flex flex-col items-center justify-center px-1.5 py-0.5 rounded-md"
                        style={{ background: `${agent.color}1A`, border: `1px solid ${agent.color}50` }}>
                        <span className="text-[12px] font-black font-mono leading-none" style={{ color: agent.color }}>{liveCount}</span>
                        <span className="text-[6px] tracking-wider mt-0.5" style={{ color: T.silverDim }}>LIVE</span>
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
                <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>DEFENSE STATUS</span>
              </div>
              <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-sm flex-shrink-0"
                style={{ background: `${T.neonGreen}12`, border: `1px solid ${T.neonGreen}33` }}>
                <motion.span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: T.neonGreen, boxShadow: `0 0 6px ${T.neonGreen}` }}
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
                <span className="text-[10px] font-bold tracking-wider" style={{ color: T.neonGreen }}>EL GUARDIÁN · ON DUTY</span>
              </div>
              <div className="space-y-2.5 flex-1">
                <StatRow label="Signals Analyzed" value={analyzedCount} color={T.babyBlue} />
                <StatRow label="Live Threats"     value={threatFeed?.active_threats ?? "—"} color="#FF8C42" />
                <StatRow label="Threats Analyzed" value={blockedCount}  color={T.neonGreen} />
                <StatRow label="Gates Online"     value="4 / 4"          color={T.royalLight} />
                <StatRow label="Shield Integrity" value="100%"           color={T.babyBlue} />
              </div>
              <div className="text-[8px] tracking-[0.18em] text-center pt-2 flex-shrink-0" style={{ color: T.silverDim }}>
                PC DIGITAL SOLUTIONS · CNS PHASE III
              </div>
            </div>
          </Panel>
        </div>

        {/* CENTER — flex-1 */}
        <Panel className="flex-1 flex flex-col min-w-0">
          <div className="relative flex flex-col items-center h-full px-8 py-3 overflow-hidden">

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
              {([["guardian", "🦅 EL GUARDIÁN"], ["goalie", "🥅 GOALIE CHAT"]] as const).map(([key, label]) => {
                const active = centerTab === key;
                return (
                  <button key={key} onClick={() => setCenterTab(key)}
                    className="py-1.5 rounded-md text-[10px] font-bold tracking-[0.16em] transition-all"
                    style={active
                      ? { background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`, color: "#04101f", boxShadow: `0 0 14px ${T.babyBlue}45` }
                      : { color: T.silverDim }}>
                    {label}
                    {key === "goalie" && !active && (
                      <span className="ml-1.5 text-[7px] font-bold px-1 py-0.5 rounded-full"
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
                  <p className="text-[9px] tracking-[0.24em] font-bold" style={{ color: T.babyBlue }}>EL GUARDIÁN · WORLD CUP 2026 DEFENSE</p>
                  <span className="flex items-center gap-1.5 text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${posture.color}15`, border: `1px solid ${posture.color}55`, color: posture.color }}>
                    <motion.span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: posture.color }}
                      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
                    {posture.label}
                  </span>
                </div>
              </div>

              {/* Live stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "ACTIVE THREATS", value: threatFeed?.active_threats ?? "—", color: "#FF8C42" },
                  { label: "GATES ONLINE",   value: "4 / 4",                          color: T.neonGreen },
                  { label: "SIGNALS SCANNED", value: threatFeed?.total_seen ?? "—",   color: T.babyBlue },
                ].map(s => (
                  <div key={s.label} className="rounded-lg px-3 py-2.5 text-center"
                    style={{ background: `${T.royalBlue}1A`, border: `1px solid ${T.royalBlue}45` }}>
                    <div className="text-xl font-black font-mono leading-none" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[8px] tracking-[0.12em] mt-1.5" style={{ color: T.silverDim }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Quick-ask chips — even 2×2 grid, the interactive hook */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {QUICK_ASKS.map(c => (
                  <button key={c.label} onClick={() => runSignal(c.q)} disabled={loading}
                    className="text-[10px] font-semibold text-center px-3 py-2 rounded-lg transition-transform hover:scale-[1.03] disabled:opacity-50"
                    style={{ background: `${T.babyBlue}12`, border: `1px solid ${T.babyBlue}40`, color: T.babyBlue }}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Conversation */}
              <Panel className="flex flex-col">
                <div className="p-3.5 flex flex-col">
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <EagleMark size={13} />
                    <span className="text-[9px] tracking-[0.3em] font-bold" style={{ color: T.babyBlue }}>EL GUARDIÁN</span>
                  </div>
                  {query && (
                    <div className="mb-2 flex-shrink-0 flex items-start gap-2 px-2.5 py-1.5 rounded-md"
                      style={{ background: `${T.royalBlue}1A`, border: `1px solid ${T.royalBlue}40` }}>
                      <span className="text-[8px] font-bold tracking-[0.2em] mt-0.5 flex-shrink-0" style={{ color: T.silverDim }}>YOU ▸</span>
                      <span className="text-[10px] leading-snug break-words" style={{ color: T.silver }}>{query}</span>
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
                                  <span className="text-[9px] tracking-[0.25em] font-bold" style={{ color: a.color }}>
                                    {r.agent.toUpperCase()} · {r.gate.toUpperCase()}
                                  </span>
                                  <span className="text-[8px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest"
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
              <div className="w-full mt-2.5 flex gap-2 items-stretch flex-shrink-0">
                <div className="flex-1 relative">
                  <textarea value={input} rows={2}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleActivate(); }
                    }}
                    placeholder="Drop a suspicious link, message, or anything that feels off…"
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
                  className="flex items-center justify-center px-6 text-[11px] font-bold tracking-[0.18em] rounded-lg disabled:opacity-60 flex-shrink-0"
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
        <div className="w-[320px] flex-shrink-0 flex flex-col gap-2 min-h-0">

          {/* Segmented tab control */}
          <div className="flex-shrink-0 grid grid-cols-3 gap-1 p-1 rounded-lg"
            style={{ background: T.panel, border: `1px solid ${T.royalBlue}55` }}>
            {([["standings", "Table"], ["fixtures", "Fixtures"], ["news", "News"]] as const).map(([key, label]) => {
              const active = rightTab === key;
              return (
                <button key={key} onClick={() => setRightTab(key)}
                  className="py-2 rounded-md text-[10px] font-bold tracking-[0.16em] transition-all"
                  style={active
                    ? { background: `linear-gradient(135deg, ${T.babyBlue}, ${T.royalLight})`, color: "#04101f", boxShadow: `0 0 14px ${T.babyBlue}45` }
                    : { color: T.silverDim }}>
                  {label.toUpperCase()}
                  {key === "news" && threatFeed && threatFeed.active_threats > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center text-[8px] font-bold px-1 rounded-full"
                      style={{ background: active ? "#04101f30" : "#FF3B3B22", color: active ? "#04101f" : "#FF8C42" }}>
                      {threatFeed.active_threats}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          <Panel className="flex-1 flex flex-col min-h-0" glow>
            <div className="p-4 flex flex-col h-full min-h-0">

              {/* ── TABLE ── */}
              {rightTab === "standings" && (
                <>
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <span className="text-[11px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>GROUP STAGE</span>
                    {liveMatch && (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: `${T.neonGreen}15`, border: `1px solid ${T.neonGreen}50`, color: T.neonGreen }}>
                        <motion.span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: T.neonGreen }}
                          animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                        {liveMatch.home.code} {liveMatch.score.home ?? 0}–{liveMatch.score.away ?? 0} {liveMatch.away.code}
                      </span>
                    )}
                  </div>
                  {standings ? (
                    <div className="flex-1 overflow-y-auto pr-1 cs-scroll space-y-4 min-h-0">
                      {standings.map(g => (
                        <div key={g.group}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold tracking-[0.18em]" style={{ color: T.babyBlue }}>{g.group.toUpperCase()}</span>
                            <div className="flex-1 h-px" style={{ background: `${T.royalBlue}55` }} />
                            <span className="text-[8px] tracking-wider" style={{ color: T.silverDim }}>P&nbsp;&nbsp;PTS</span>
                          </div>
                          <div className="space-y-0.5">
                            {g.table.map((r, i) => {
                              const adv = (r.position ?? 9) <= 2;
                              return (
                                <div key={r.team.code || r.team.name || r.position || i} className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                                  style={{ background: adv ? `${T.babyBlue}12` : "transparent" }}>
                                  <span className="w-4 text-center text-[11px] font-bold font-mono"
                                    style={{ color: adv ? T.babyBlue : T.silverDim }}>{r.position}</span>
                                  {r.team.crest && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={r.team.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                                  )}
                                  <span className="flex-1 truncate text-[12px]" style={{ color: adv ? "#E6EDF3" : T.silver }}>
                                    {r.team.name || r.team.code}
                                  </span>
                                  <span className="w-5 text-center text-[11px] font-mono" style={{ color: T.silverDim }}>{r.played}</span>
                                  <span className="w-6 text-right text-[12px] font-mono font-bold" style={{ color: GOLD }}>{r.points}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px]" style={{ color: T.silverDim }}>Awaiting live standings…</div>
                  )}
                </>
              )}

              {/* ── FIXTURES ── */}
              {rightTab === "fixtures" && (
                <>
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <span className="text-[11px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>UPCOMING FIXTURES</span>
                    <span className="text-[8px] tracking-[0.16em]" style={{ color: T.silverDim }}>CYBERSHIELD THREAT</span>
                  </div>
                  {upcoming ? (
                    <div className="flex-1 overflow-y-auto pr-1 cs-scroll space-y-2 min-h-0">
                      {upcoming.slice(0, 8).map((m, i) => {
                        const lvl = m.threat?.level ?? "GUARDED";
                        const c = LEVEL_COLOR[lvl] ?? T.silverDim;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.04 * i }}
                            className="rounded-lg p-2.5" style={{ background: `${T.royalBlue}1A`, border: `1px solid ${c}40` }}>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="flex items-center gap-1.5 text-[13px] font-semibold truncate" style={{ color: "#E6EDF3" }}>
                                {m.home.crest && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.home.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                                )}
                                {m.home.code || m.home.name}
                                <span className="text-[10px] font-normal" style={{ color: T.silverDim }}>vs</span>
                                {m.away.code || m.away.name}
                                {m.away.crest && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.away.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                                )}
                              </span>
                              <span className="flex items-center gap-1 text-[8px] font-bold tracking-widest px-2 py-1 rounded-full flex-shrink-0"
                                style={{ background: `${c}1F`, border: `1px solid ${c}66`, color: c }}>
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c }} />
                                {lvl}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]" style={{ color: T.silverDim }}>
                              <span>{kickoffLabel(m.utcDate)}{m.group ? ` · ${m.group.toUpperCase()}` : ""}</span>
                              {m.threat && <span style={{ color: c }}>{m.threat.agent}</span>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px]" style={{ color: T.silverDim }}>Awaiting fixtures…</div>
                  )}
                </>
              )}

              {/* ── NEWS ── */}
              {rightTab === "news" && (
                <>
                  <div className="flex items-center justify-between mb-1 flex-shrink-0">
                    <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em]" style={{ color: "#fff" }}>
                      <motion.span className="text-[13px] leading-none"
                        animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>🌐</motion.span>
                      WORLD CUP NEWS
                    </span>
                  </div>
                  <div className="text-[9px] tracking-[0.14em] mb-3 flex-shrink-0" style={{ color: T.silverDim }}>
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
                            <span className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm"
                              style={{ background: `${c}1F`, border: `1px solid ${c}55`, color: c }}>
                              {isThreat ? t.severity : "NEWS"}
                            </span>
                            <span className="text-[9px] font-semibold tracking-wide truncate" style={{ color: c }}>{t.agent}</span>
                            <span className="ml-auto text-[9px] flex-shrink-0" style={{ color: T.silverDim }}>{timeAgo(t.ts)}</span>
                          </div>
                          {/* headline */}
                          <div className="text-[12px] leading-relaxed mb-1" style={{ color: "#E6EDF3" }}>{t.title}</div>
                          <div className="text-[9px] mb-2 truncate" style={{ color: T.silverDim }}>{t.source || "World Cup wire"}</div>
                          {/* recommendation */}
                          {t.recommendation && (
                            <div className="flex items-start gap-2 rounded-md p-2 mb-2"
                              style={{ background: `${c}12`, border: `1px solid ${c}33` }}>
                              <span className="mt-0.5 flex-shrink-0"><EagleMark size={13} color={c} glow="#00000000" /></span>
                              <span className="text-[10px] leading-snug" style={{ color: T.silver }}>
                                <span className="font-bold" style={{ color: c }}>El Guardián: </span>{t.recommendation}
                              </span>
                            </div>
                          )}
                          {/* actions */}
                          <div className="flex items-center gap-2">
                            <button onClick={() => askGuardian(t.title)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[9px] font-bold tracking-[0.16em] transition-transform hover:scale-[1.02]"
                              style={{ background: c, color: "#04101f", boxShadow: `0 0 12px ${c}55` }}>
                              <EagleMark size={13} color="#04101f" glow="#00000000" />
                              ASK EL GUARDIÁN
                            </button>
                            <a href={t.link} target="_blank" rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-md text-[9px] font-bold tracking-wide transition-colors hover:bg-white/5"
                              style={{ border: `1px solid ${T.neonGreen}60`, color: T.neonGreen }}>
                              READ ↗
                            </a>
                          </div>
                        </motion.div>
                      );
                    }) : (
                      <div className="text-[11px]" style={{ color: T.silverDim }}>Scanning live World Cup feeds…</div>
                    )}
                  </div>
                </>
              )}

            </div>
          </Panel>

        </div>
      </div>

      {/* footer — World Cup ticker */}
      <div className="relative overflow-hidden flex-shrink-0 py-1"
        style={{ borderTop: `1px solid ${T.royalBlue}40` }}>
        <div className="cs-ticker flex w-max whitespace-nowrap text-[9px] tracking-[0.25em]" style={{ color: T.silverDim }}>
          {[0, 1].map(k => (
            <span key={k} className="flex items-center">
              {[
                "FIFA WORLD CUP 2026", "JUNE 11 — JULY 19", "48 TEAMS", "104 MATCHES", "16 HOST CITIES",
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
    </div>
  );
}
