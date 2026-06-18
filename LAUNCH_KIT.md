# CyberShield AI — LinkedIn Launch Kit

Everything you need to record and post the launch. All demo signals are tested and confirmed working.

---

## 0. Bring the app up (run before recording)

**Backend (El Guardián / FastAPI):**
```powershell
powershell -ExecutionPolicy Bypass -File C:\CyberLab\CyberShield_IV\start_backend.ps1
```
Wait until http://127.0.0.1:8000/status returns `"status":"online"`.

**Frontend (dashboard):**
```powershell
cd C:\CyberLab\cybershield-dashboard
npm run dev
```
Then open **http://localhost:3000** and go fullscreen.

> Keep BOTH terminal windows open the whole time — closing either takes the app offline.

---

## 1. Demo signals (copy-paste — TESTED)

### HERO — single gate, clean (use this one on camera)
```
URGENT: You won free tickets to the World Cup final! Verify your wallet and pay a small fee to claim your prize now: http://fifa-tickets-2026.win/claim
```
→ Fires **Gate A**, Anti-Scammer Goalie lights up, El Guardián calls it a phishing scam and references the real July 19 MetLife final. ~2s response.

### BOSS FIGHT — multi-gate escalation (optional / follow-up post)
```
Deepfake video of the President promoting a fake ticket giveaway is going viral, driving a traffic spike and bot flood to our payment page during the broadcast.
```
→ Fires **3 gates at once** (A + C + D, primary Red Card Sentinel).

> ⚠️ Keep signals in ENGLISH. The gate detector only matches English keywords — a Spanish scam ("boleto", "paga") gets a verdict but lights up NO gate on screen.

---

## 2. Shot-by-shot recording script (~45 sec)

| Time | Shot | Action |
|------|------|--------|
| 0:00–0:03 | **Cold open** | Pan across the dashboard — "ALL SYSTEMS ACTIVE", 4 gates, live scoreboard, Golden Boot. Let it breathe. |
| 0:03–0:08 | **The threat** | Paste the HERO signal into the input. Pause on the scam text so viewers read it. |
| 0:08–0:10 | **Trigger** | Click **SHIELD ACTIVATE**. |
| 0:10–0:18 | **The save** | El Guardián's verdict streams in + **Anti-Scammer Goalie (Gate A) lights up** + Real-Time Logs tick. THIS is the money shot — hold it. |
| 0:18–0:25 | **Proof it's real** | Glance to Golden Boot / Results panel (live data) and the live scoreboard. |
| 0:25–0:30 | **Close** | "Threat blocked. Red card." Cut to your face / PapiCyberz logo. |

---

## 3. Voiceover / narration (optional — speak over the clip)

> "The 2026 World Cup will be the biggest target for scammers in history.
> So I built an AI that defends fans like a goalie defends a net.
> Watch — a fake-ticket scam comes in… El Guardián reads it, routes it to the right gate, and red-cards it in real time.
> No human in the loop until it matters. This is CyberShield AI."

---

## 4. LinkedIn caption (paste with the video)

> The 2026 World Cup will be the most scam-targeted event in history.
> So I built an AI that defends fans like a goalie defends a net. 🧤
>
> Meet **El Guardián** — it spots a fake-ticket scam, routes it to the right "gate," and red-cards it in real time. No human in the loop until it matters.
>
> This is CyberShield AI by PapiCyberz. Built for the millions who'll be hunting for tickets, streams, and souvenirs — and the scammers waiting for them.
>
> What's the worst scam you've seen pop up around a big event? 👇
>
> #AI #CyberSecurity #WorldCup2026 #BuildInPublic #PapiCyberz

---

## 5. Pre-record checklist

- [ ] Backend `/status` = online
- [ ] Dashboard reloaded to clean state (response box reads "actively monitoring", logs say "Awaiting first signal…")
- [ ] Browser fullscreen
- [ ] HERO signal copied to clipboard
- [ ] Screen recorder armed
- [ ] Golden Boot / Results panel showing live data (not a DEMO badge)
