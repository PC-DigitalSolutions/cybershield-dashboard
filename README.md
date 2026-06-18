# CyberShield AI — Dashboard 🦅🛡️

**The live command center for CyberShield AI — real-time cyber-threat intelligence for the 2026 FIFA World Cup.**

A sleek, single-screen operations dashboard where fans and organizers can watch live World Cup threats roll in, see which specialist agent is handling each one, and tap to ask **El Guardián** (the AI security director) to explain any threat in plain language.

> This is the **Next.js frontend**. It talks to the FastAPI backend at **[CyberShield_IV](https://github.com/PC-DigitalSolutions/CyberShield_IV)**.

<!-- TODO: add a screenshot or GIF of the dashboard here — it's the strongest selling point -->
<!-- ![CyberShield dashboard](docs/screenshot.png) -->

---

## What it does

- **🌐 Live threat monitor** — auto-refreshing feed of real World Cup security news, each item tagged with severity, the responsible agent, and a plain-English **recommendation** the public can act on.
- **⚡ Tap-to-ask El Guardián** — hit *Ask El Guardián* on any headline (or use the quick-ask chips) and the AI analyzes it live, engaging the right specialist agent.
- **🥅 Live agent load bars** — see each of the four agents' real-time share of active threats (the Anti-Scammer Goalie usually leads — ticket-scam season).
- **📊 Standings · Fixtures · News** — a clean tabbed panel with live group tables, upcoming matches, and a **CyberShield threat level** assessed for every fixture.
- **📋 Today's threat briefing** — El Guardián summarizes the day's live threats on demand.

---

## Tech stack

- **Next.js 16** + **React 19** (App Router, client console)
- **Tailwind CSS v4** + **Framer Motion** (animations)
- **lucide-react** icons
- Talks to the CyberShield FastAPI backend via REST (polling: news 30s, matches 60s)

---

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

By default it expects the backend at `http://127.0.0.1:8000`. To point at a deployed backend, set:

```bash
# .env.local  (or your host's env vars)
NEXT_PUBLIC_API_BASE=https://your-backend-url
```

> You'll want the [backend](https://github.com/PC-DigitalSolutions/CyberShield_IV) running too — it serves the live feed, match data, and El Guardián.

---

## Deploy

Full guide (Vercel + Render + custom `.tech` domain) in **[DEPLOYMENT.md](DEPLOYMENT.md)**. Short version:

1. Import this repo into **Vercel** (Next.js auto-detected)
2. Set `NEXT_PUBLIC_API_BASE` to your deployed backend URL
3. Ship 🚀

---

## Design notes

- Two-stage by design: the backend's monitoring runs free 24/7; the LLM only fires on user interaction — so the dashboard is always live without burning API quota.
- Honest UX: where live data has gaps (e.g., the match feed has no host-city field), the UI says so rather than faking it.

---

Built by **PC Digital Solutions**. · *Strength. Vigilance. Intelligence.*
