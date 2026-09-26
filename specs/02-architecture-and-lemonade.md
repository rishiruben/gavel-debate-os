# Technical Architecture & Lemonade Server Integration

## System Overview

```
                                  ┌────────────────────────┐
                                  │   Creator Dashboard    │
                                  │   /room/:id/host       │
                                  └───────────┬────────────┘
                                              │ WebSockets / State Engine
         ┌────────────────────────────────────┼────────────────────────────────────┐
         ▼                                    ▼                                    ▼
┌────────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
│     Speaker Stage      │         │  OBS Broadcast Overlay │         │   Audience Companion   │
│  /room/:id/debater     │         │  /room/:id/overlay     │         │   /room/:id/vote       │
│  (Mic & Teleprompter)  │         │  (Transparent 1080p)   │         │   (Live Round Polls)   │
└───────────┬────────────┘         └───────────┬────────────┘         └────────────────────────┘
            │                                  ▲
            ▼                                  │
┌──────────────────────────────────────────────┴───────────────────────────────────────────────┐
│ Gavel Core Engine (Next.js App Router + Real-Time State Store)                                │
│  ├── Stage State Machine (Lobby -> Readiness -> Rounds -> The Second -> Verdict)             │
│  ├── Speaker Audio & Attribution (Deterministic isolation per speaker)                       │
│  ├── Argument & Claim Ledger (Extracts claims, matches rebuttals, flags dropped points)      │
│  └── Lemonade Server Adapter (OpenAI-compatible /v1, 100-pt Rubric, Coach "The Second")      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Lemonade Server Role

- **OpenAI-compatible local server**: `http://localhost:8000/v1`.
- **Zero API bills**: Run local frontier weights (Llama 3.3 70B, Qwen 2.5 72B, Mistral Nemo) on creator hardware.
- **Latency & Ping check**: Automated health monitoring at startup and in the host control room.
- **Offline Fallback Engine**: Built-in heuristic fallback engine ensuring live broadcasts and local demos never fail or stall.
