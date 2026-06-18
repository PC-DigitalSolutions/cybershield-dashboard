# CyberShield — Deploy & Demo Guide

Goal: get CyberShield off `localhost` onto public URLs a recruiter can click, plus a tight demo script. Two pieces deploy separately:

- **Frontend** (this repo, Next.js) → **Vercel**
- **Backend** (`CyberShield_IV`, FastAPI) → **Render** (Docker)

---

## ⚠️ STEP 0 — Security first (do this before anything is public)

Your Google/Gemini API key has been sitting in plaintext in `start_backend.ps1` and `.env`. The moment a repo goes public, that key is burned.

1. **Rotate the Gemini key** at https://aistudio.google.com/apikey (delete the old one, make a new one). Do the same for the football-data token if you want.
2. **Never commit secrets.** Confirm `.gitignore` (in `CyberShield_IV`) ignores `.env` and `start_backend.ps1`. Keys live only in the host's env-var settings (below).
3. Use the **new** keys in Render's environment, not in any committed file.

---

## STEP 1 — Push both repos to GitHub

Vercel and Render deploy from GitHub.

- `cybershield-dashboard` → its own GitHub repo
- `CyberShield_IV` → its own GitHub repo (keep **private** if unsure about secrets)

---

## STEP 2 — Deploy the backend (Render)

1. https://render.com → **New → Web Service** → connect the `CyberShield_IV` repo.
2. Render auto-detects the **Dockerfile**. (It already runs `src.api.main:app` and binds `$PORT`.)
3. **Environment variables** (Render → Environment):
   - `CYBERSHIELD_API_KEY` = your **new** Gemini key
   - `FOOTBALL_DATA_TOKEN` = your football-data.org token
   - `FRONTEND_ORIGIN` = your Vercel URL (add after Step 3, e.g. `https://cybershield.vercel.app`)
4. Deploy. Note the URL, e.g. `https://cybershield-api.onrender.com`.
5. Test it: open `https://<your-backend>/status` → should return `{"status":"online"}`.

> Note: Render's free tier sleeps after inactivity — first request after idle takes ~30s to wake. Fine for a demo; mention it or upgrade if needed.

---

## STEP 3 — Deploy the frontend (Vercel)

1. https://vercel.com → **Add New → Project** → import `cybershield-dashboard`.
2. Framework preset: **Next.js** (auto-detected).
3. **Environment variable**:
   - `NEXT_PUBLIC_API_BASE` = your Render backend URL (e.g. `https://cybershield-api.onrender.com`)
4. Deploy. You get a URL like `https://cybershield.vercel.app`.
5. **Go back to Render** and set `FRONTEND_ORIGIN` to that Vercel URL, then redeploy the backend (CORS needs it). *(Vercel `*.vercel.app` domains are already allowed by the CORS regex, so this is belt-and-suspenders.)*

---

## STEP 4 — Verify the live site

- Open the Vercel URL. The News tab should populate within ~30s.
- Tap **ASK EL GUARDIÁN** on a card → you should get a live response.
- If the feed/console is empty: open the backend `/status` and `/threats/live` URLs directly to confirm the API is awake and reachable, and double-check `NEXT_PUBLIC_API_BASE`.

---

## ⚠️ Public-demo caveat (quota)

Once live, **anyone** who finds the URL can hit `ASK EL GUARDIÁN` and spend your Gemini quota. For a portfolio demo that's usually fine, but if you share it widely, consider:
- Keeping the link low-key (resume/LinkedIn only, not posted publicly), or
- Adding simple rate-limiting / a daily cap later (ask me and I'll wire it).

The background monitor itself is free (Google News RSS + keyword logic) — only the on-demand LLM calls cost quota.

---

## 🎬 60–90 second demo script (for the video / interview)

> Record with the dashboard full-screen. Keep it tight.

1. **Hook (0:00–0:10)** — "This is CyberShield AI — a live cyber-threat command center for the 2026 World Cup. Everything you'll see is real, current data."
2. **Live monitoring (0:10–0:30)** — Point at the **News** tab: "It scans Google News every 75 seconds, auto-classifies each World Cup threat into one of four security gates, and assigns the responsible agent." Point at the **left agent load bars**: "Right now the Anti-Scammer Goalie is handling 73% of active threats — ticket fraud season."
3. **Interactive AI (0:30–0:55)** — Tap **ASK EL GUARDIÁN** on a real story (e.g., the passport-leak breach): "I can ask the AI about any live story. It pulls the live intel feed as ground truth, gives a human explanation, and dispatches the right specialist — here, the Sideline Referee citing GDPR breach-notification rules."
4. **Depth (0:55–1:15)** — Switch to **Table/Fixtures**: "It also tracks standings and assigns a CyberShield threat level to every upcoming match." Tap **Today's Threat Briefing** chip: "And it'll summarize the day's threats on demand."
5. **Close (1:15–1:30)** — "Full-stack: FastAPI backend with a two-stage pipeline — cheap keyword triage running 24/7, the LLM only firing on demand to control cost. Built and deployed solo."

**One-liner for resume/LinkedIn:**
> Built & deployed CyberShield AI — a real-time threat-intelligence platform that ingests 1,000+ daily security signals, triages them through a 4-gate classification system, and delivers on-demand multi-agent LLM analysis. Stack: Next.js, FastAPI, Google Gemini, live news + sports APIs.
