# GAVEL — AI-Moderated Debate Operating System ⚖️

> **The turn-key debate broadcast harness for streamers and creators, powered by Lemonade Server.**

Gavel turns any stream into an interactive, broadcast-grade debate show in under 60 seconds. It handles stage timing, clean speaker attribution, real-time argument ledgers, and automated 100-point rubric refereeing with corner coaching between rounds (**"The Second"**).

---

## 🚀 Key Features

* **The 4 Connected Surfaces**:
  * **Host Control Room (`/room/:id/host`)**: Complete stage director controls, emergency pause, +30s clock extensions, live claim ledger, and the score release gate.
  * **Debater Green Room & Stage (`/room/:id/debater?token=p1|p2`)**: Zero-friction guest links, live microphone audio checks, high-visibility teleprompter clocks, and private corner coaching.
  * **Broadcast OBS Overlay (`/room/:id/overlay`)**: Transparent 1080p browser-source URL for OBS Studio/Streamlabs with animated lower thirds, round clocks, claim alerts, between-round scorecards, and final victory celebrations.
  * **Audience Companion (`/room/:id/vote`)**: Real-time mobile voting that generates the signature *"Audience vs. AI Referee"* broadcast comparison.
* **Powered by Lemonade Server**:
  * Out-of-the-box support for [Lemonade Server](https://lemonade-server.ai) running local LLMs (e.g. `llama-3.3-70b`, `qwen-2.5-72b`) via OpenAI-compatible endpoints (`http://localhost:8000/v1`).
  * Zero cloud per-minute costs for streamers.
  * Intelligent offline fallback evaluator for quick testing and local demos.
* **100-Point Transparent Rubric Engine**:
  * **Argumentation (30 pts)**
  * **Rebuttal & Dropped Points (30 pts)**
  * **Clarity & Structure (20 pts)**
  * **Composure & Rules (10 pts)**
  * **Factual Grounding (10 pts)**

---

## 🛠️ Quick Start

### 1. Install & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Connect Lemonade Server (Optional for local AI)
If you have Lemonade Server installed and running locally on port 8000:
* Gavel auto-detects `http://localhost:8000/v1`.
* You can configure custom endpoints via `.env.local`:
```env
LEMONADE_BASE_URL=http://localhost:8000/v1
LEMONADE_MODEL=llama-3.3-70b
```

### 3. Add Overlay to OBS Studio
1. In OBS Studio, add a new **Browser Source**.
2. Set the URL to your room's overlay link: `http://localhost:3000/room/<ROOM_ID>/overlay`
3. Width: `1920`, Height: `1080`.
4. Check **"Shutdown source when not visible"** (optional) and click **OK**.
