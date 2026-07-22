# CyberShield AI — *El Guardián*
### A community-trained cyber-defense command center for the FIFA World Cup 2026

> **Strength. Vigilance. Intelligence.**
> Live product · Full-stack · Bilingual (EN / ES) · Built solo

---

## TL;DR (for the 30-second reader)

**CyberShield AI is a live cyber-defense platform that protects everyday people — especially non-technical and Spanish-speaking fans — from the wave of scams surrounding the FIFA World Cup 2026.**

At its core is **El Guardián**, a routing "brain" (`ElGuardianCNS`) that classifies any incoming signal — a suspicious text, a sketchy ticket link, a viral video, a traffic spike — and dispatches it to one of four specialist agents, resolves conflicts between them with a severity hierarchy, and produces a **Unified Threat Report** with recommended actions and human-in-the-loop escalation.

On top of that engine sits the **Anti-Scammer Goalie**: a bilingual chat assistant plus a **Community Scam Wall** where every story a victim shares makes the system smarter for the next person.

- **Live:** dashboard on Vercel, API on Render
- **Stack:** Next.js 16 / React 19 / Tailwind 4 / Framer Motion · FastAPI / Uvicorn / Python · Google Gemini
- **What makes it senior-level:** a two-stage detection pipeline that keeps LLM cost near zero at scale, a multi-agent conflict-resolution arbiter, and a community feedback loop that turns users into the training set.

---

## 1. The problem

Every global tournament is a feeding frenzy for fraud. Around the World Cup, scammers run:

- **Fake ticket sales** ("half-price, pay by bank transfer today")
- **Phishing & smishing** ("your FIFA ticket was cancelled, verify your card in 24h")
- **Romance / "sugar daddy" scams** that pivot to gift cards and wire transfers
- **Deepfaked** player/official videos and manipulated broadcasts
- **Infrastructure attacks** — traffic floods and bot surges against ticketing and streaming

The people most exposed are the least served by existing tools. Enterprise security products are built for SOC analysts, cost thousands, and are **English-only**. A grandmother getting a scam text in Spanish, or a first-time fan buying tickets on Instagram, has nowhere to turn that speaks their language — literally or figuratively.

**CyberShield exists to close that gap: enterprise-grade defense logic, delivered in plain language, in English *o en español*, for free.**

---

## 2. Who it's for

- **Everyday fans** — non-technical people who just want to know "is this real or a scam?"
- **Spanish-speaking / Latinx communities** — first-class bilingual support, not an afterthought translation
- **Community partners** — built with [Raíces Cyber Organization](https://www.raicescyber.org/) and a cohort of beta testers whose real scam reports train the system

This audience focus is a deliberate product decision, not a demographic footnote. It's the reason the UX leads with "Paste the suspicious message here…" instead of a threat-intel console, and the reason every user-facing string ships in two languages.

---

## 3. Architecture at a glance

CyberShield is a three-layer system: a **command-center frontend**, the **El Guardián CNS engine**, and an **operations layer** of live feeds and intelligence.

```
                         ┌───────────────────────────────────────────┐
                         │   COMMAND CENTER  (Next.js 16 / React 19)  │
                         │   • El Guardián console                    │
                         │   • Anti-Scammer Goalie chat + Scam Wall   │
                         │   • Live threat monitor + agent panels     │
                         └───────────────────┬───────────────────────┘
                                             │  REST (FastAPI)
                         ┌───────────────────▼───────────────────────┐
                         │        EL GUARDIÁN CNS  (the "brain")      │
                         │                                            │
                         │   signal ─► detect_gates() ─► [A B C D]    │
                         │                    │                       │
                         │        Primary Arbiter (severity rank)     │
                         │        C  >  A  >  B  >  D                  │
                         │                    │                       │
                         │        Unified Threat Report (UTR)         │
                         │        + Human-in-the-Loop on escalation   │
                         └───────────────────┬───────────────────────┘
                                             │
             ┌───────────────┬───────────────┼───────────────┬───────────────┐
             ▼               ▼               ▼               ▼               ▼
        Gate A          Gate B          Gate C          Gate D         Community
     Anti-Scammer      Sideline       Red Card       Las Barras         Intel
        Goalie         Referee        Sentinel         Bravas          (Scam Wall
    scam / phish /   compliance /   deepfake /      DDoS / traffic /   trains the
    fraud / tickets  GDPR / LGPD    synthetic media  crowd surge        Goalie)
```

**The four gates / agents:**

| Gate | Agent | Watches for |
|------|-------|-------------|
| **A** | Anti-Scammer Goalie | Scams, phishing, fraud, fake tickets, payment/credential theft |
| **B** | Sideline Referee | Compliance & privacy — GDPR, LGPD, zero-trust, unauthorized access |
| **C** | Red Card Sentinel | Deepfakes, synthetic media, manipulated broadcasts, identity |
| **D** | Las Barras Bravas Triage | Infrastructure — DDoS, traffic spikes, bot floods, anomalies |

---

## 4. The decisions that make it senior-level

A working demo shows you can code. **Design decisions show you can think.** Here are the four that matter most.

### 4.1 Two-stage detection — LLM cost stays near zero at scale

The live threat monitor ingests a continuous stream of security headlines (Google News RSS). Naively, you'd send every item to an LLM to classify it. At feed scale that's **slow and expensive** — hundreds of model calls an hour for content that's 90% irrelevant.

Instead, CyberShield runs a **cheap first pass**: the CNS `detect_gates()` uses word-boundary keyword matching to decide, in microseconds and for zero cost, whether a signal is even relevant and which gate(s) it touches. **The LLM (Gemini) is only invoked on demand** — when a user actually asks El Guardián to analyze a specific headline, or engages the Goalie in conversation.

Crucially, this cost optimization lives *below* the user-facing analysis and never compromises it: the keyword pass exists to triage the English-language security-news feed cheaply, while the actual scam analysis a user receives runs through the LLM — which is **fully multilingual by design** (see §4.4). Fast free triage where it can be cheap; deep, language-aware reasoning where it counts.

This is the kind of cost/latency/accuracy tradeoff that comes up in every serious systems-design interview. CyberShield makes it explicitly.

### 4.2 Multi-agent conflict resolution — a Primary Arbiter, not a free-for-all

Real signals trip more than one gate. A message like *"click this link to verify your cancelled ticket"* is both a **scam** (Gate A) and potentially a **credential/compliance** issue (Gate B). What does the system *do* when agents disagree on severity?

CyberShield resolves this with an explicit **severity hierarchy**:

```
Red Card Sentinel  >  Anti-Scammer Goalie  >  Sideline Referee  >  Las Barras Bravas
      (C)                     (A)                    (B)                  (D)
```

When multiple gates fire, the CNS picks the **primary gate** by rank, runs *all* triggered agents, and — critically — flags the event for **escalation and Human-in-the-Loop review**, bundling everything into a single **Unified Threat Report** with a stable report ID, severity, MITRE ATT&CK mapping, and de-duplicated recommended actions.

That "when in doubt, escalate to a human" instinct is exactly what distinguishes security engineering from generic app development.

### 4.3 The community defense loop — users *are* the training set

The **Community Scam Wall** turns CyberShield from a static tool into a living one. When a fan shares what happened to them:

1. Their story is **PII-scrubbed** automatically (emails, phone numbers removed) — privacy by design.
2. It's stored with a scam-type tag, **only with explicit consent** to share anonymously.
3. Future Goalie conversations **match against community reports** — when the Goalie recognizes a pattern the community already flagged, it surfaces a `COMMUNITY INTEL ×N` badge, giving the user real, crowd-sourced corroboration.

Every victim who speaks up measurably protects the next person. That's a **network effect built directly into the product's mission** — and it reframes the user from "person being protected" to "defender on the wall." (The UI literally calls them *Defender #N*.)

### 4.4 Product-first UX for a non-technical, bilingual audience

Every decision optimizes for someone scared and confused, not a security pro:

- Opening line is an invitation — *"Paste any message, offer, or profile that feels off"* — not a command prompt.
- **Multilingual from day one, not bolted on.** The Goalie and every specialist agent are instructed to *automatically match the user's language* — English, Spanish, or anything else — so a user writes in their own words and gets answered in their own words. This isn't a translated UI wrapper; the *analysis itself* is language-native, because it runs through the LLM end-to-end. For an audience that enterprise security has always ignored, this is the whole point.
- Professional, judgment-free tone: *"Every conversation is private and judgment-free."*
- The whole thing is themed as a **World Cup command center** — familiar, human, and on-brand rather than intimidating.

---

## 5. Technical implementation

**Frontend**
- **Next.js 16** (App Router) + **React 19**, deployed on **Vercel**
- **Tailwind CSS 4** for the command-center design system
- **Framer Motion** for the live-status animations (agent "engaged" pulses, scanning eye, threat-load bars)
- Single-screen dashboard: El Guardián console, Goalie chat, Community Scam Wall, live match feed, and a real-time threat monitor that polls the API on independent intervals

**Backend**
- **FastAPI + Uvicorn** (Python), deployed on **Render**
- **`ElGuardianCNS`** — the routing core: `detect_gates()` → `choose_primary_gate()` → per-agent execution → `build_utr()`
- **Agent registry** pattern so each gate's specialist logic is independently testable and swappable
- **Google Gemini** for on-demand natural-language analysis and the Goalie's bilingual reasoning
- Endpoints: `/analyze`, `/goalie/chat`, `/goalie/report`, `/goalie/stories`, `/threats/live`, `/matches`

**Operations / intelligence layer**
- Live threat feed: Google News RSS → CNS gate classification → severity scoring → `/threats/live`
- Unified Threat Report generation with report IDs and MITRE ATT&CK references
- Community intel store feeding the Goalie's pattern matching

---

## 6. What's live today

- ✅ **El Guardián command center** — deployed, analyzing signals across all four gates
- ✅ **Anti-Scammer Goalie MVP** — bilingual chat handling romance, dating-app, ticket, phishing, extortion, and everyday scams
- ✅ **Community Scam Wall** — live report submission, PII scrubbing, consent flow, and community-intel matching
- ✅ **Live threat monitor** — real-time headline ingestion with per-gate threat-load visualization
- ✅ **Community partnership** — built with Raíces Cyber and an active beta-tester cohort

---

## 7. Roadmap — where this goes next

CyberShield is the first product in an intended line of accessible, community-driven security tools. Near-term:

1. **Spanish-language threat intelligence sources** — the live monitor already reasons in any language; next is broadening *intake* to ingest security news from Spanish-language outlets, so threats hitting Spanish-speaking regions surface first instead of arriving translated and late.
2. **Exportable threat reports** — turn the Unified Threat Report into a shareable/downloadable artifact (PDF) for users who want to report to authorities or their bank.
3. **Semantic gating** — augment keyword matching with lightweight embeddings to catch paraphrased scams the keyword pass misses, without giving up the cheap-first-pass cost profile.
4. **Persistent community intelligence** — graduate the Scam Wall from in-memory to a durable store with trend analytics ("romance scams up 40% this week").
5. **Mobile-first companion** — meet users where the scams actually arrive: their phones.

---

## 8. Why this project matters (the personal thesis)

CyberShield is the flagship of my work as an **IAM / cybersecurity engineer** and founder of **Latinxs for Cybersecurity**. It's where three things I care about intersect:

- **Security engineering done right** — routing, conflict resolution, human-in-the-loop, cost-aware pipelines.
- **Access** — the people who most need protection are the ones enterprise security has never spoken to. This does.
- **Community** — it's built *with* a community and it gets stronger *because* of that community.

It's the beginning of a digital legacy: a line of elite, human-centered security solutions that treat protecting ordinary people as a first-class engineering problem.

---

*CyberShield AI — El Guardián · PC Digital Solutions*
*Built by Aldo Chernes Pineda · In partnership with Raíces Cyber Organization*
