# GAVEL — Product Specification & Idea Record

Preserved from original working documents (24 September 2026).

---

## Part I — Rishi's Original Ideas

### Idea 01 — AI-moderated debate platform / live conversation harness
* **Original spark (19 September 2026)**:
  > *"An AI debate moderator that scores live streamed debates in real time with feedback between rounds. I see this becoming its own genre of content."*
* **Product-moat clarification (24 September 2026)**:
  > *"The one place that I disagree with you completely is the piece where you're saying the moat is in the tech. You're saying anyone can prompt an LLM to judge. But nobody does. The piece, the tech piece, is not the LLM, it's the wrapper around the LLM. The reason why Meta Muse and things like Hermes Agent is so good is because of the harness that allows it to allow people to execute against a certain task, and that is what people need. We need to create the UI and an application layer that allows any streamer, group of streamers, to hit a couple of buttons and immediately they're in this unique experience of an AI-moderated debate. And we need to work on the branding there. Maybe whatever we brand this should have a verb form, and there's a verb for AI-debated moderation that we coin. So that's what I think. So I kind of push back on the fact that the moat isn't the tech. I think the moat is there. There's a big part of that of this that is still technology."*

### Idea 02 — Normalized group fitness challenges (Parked)
* **Original spark (19 September 2026)**:
  > *"An app like GoJoe that asked group fitness challenges. All types of activities are welcome and points get normalized. This app would kick ass in India if done right."*

---

## Part II — Product Specification & Architecture (Gengar Analysis)

### The Job to be Done
> *"Help me run a compelling, credible, technically smooth live show without hiring a production team or becoming an AI engineer."*

1. **The 5-Minute Setup Flow**:
   - Room setup (topic, format, participants).
   - Frictionless participant invitation links (zero-install, zero-account).
   - Automated audio & readiness check.
   - Host control room + OBS browser-source overlay.
2. **The Signature Between-Round Feature ("The Second")**:
   - Round score & margin.
   - Strongest move made by each participant.
   - Critical unanswered or dropped point.
   - Concrete tactical adjustment for the next round.
3. **100-Point Transparent Rubric**:
   - Argumentation (30)
   - Rebuttal & Engagement (30)
   - Clarity & Structure (20)
   - Composure & Rules (10)
   - Factual Grounding (10)
