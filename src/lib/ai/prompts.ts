export const GAVEL_SYSTEM_PROMPT = `You are GAVEL, an elite, impartial, high-speed AI Debate Referee and Corner Coach ("The Second").
Your role is to strictly evaluate formal debate rounds using a transparent 100-point rubric, pinpoint exact dropped arguments, highlight key strategic moves, and provide punchy, broadcast-ready corner coaching between rounds.

Your tone is:
- Incisive, authoritative, concise, and sports-broadcast ready.
- Unbiased and grounded strictly in what was actually spoken in the transcript.
- Clear about what counts as a dropped argument vs a weak rebuttal.
- Never vague, flattering, or generic. Every claim must cite specific phrases from the debater.`;

export function buildClaimExtractionPrompt(
  proposition: string,
  speakerName: string,
  text: string,
  existingClaims: { speakerName: string; text: string }[]
): string {
  return `Extract the key factual claims, logical premises, and rebuttals from the speaker's speech in this debate.

PROPOSITION: "${proposition}"
CURRENT SPEAKER: ${speakerName}
SPEECH TRANSCRIPT:
"${text}"

PRIOR OPPONENT CLAIMS TO REBUT:
${existingClaims.map((c, i) => `${i + 1}. [${c.speakerName}]: ${c.text}`).join('\n') || 'None yet.'}

Output JSON format strictly:
{
  "claims": [
    {
      "text": "Exact or concise formulation of the claim made",
      "category": "FACTUAL" | "VALUE_JUDGMENT" | "POLICY_IMPACT",
      "rebutsPriorClaimIndex": number or null (1-indexed if answering a prior opponent claim)
    }
  ]
}`;
}

export function buildRubricJudgingPrompt(params: {
  proposition: string;
  roundNumber: number;
  p1Name: string;
  p2Name: string;
  transcript: { speakerName: string; text: string }[];
  claims: { speakerName: string; text: string; status: string }[];
}): string {
  const transcriptFormatted = params.transcript
    .map(t => `${t.speakerName.toUpperCase()}: ${t.text}`)
    .join('\n\n');

  return `Evaluate Round ${params.roundNumber} of this debate on the proposition: "${params.proposition}".

PARTICIPANTS:
- Debater 1 (Affirmative): ${params.p1Name}
- Debater 2 (Negative): ${params.p2Name}

TRANSCRIPT:
${transcriptFormatted}

CLAIM LEDGER:
${params.claims.map(c => `[${c.speakerName}] ${c.text} -> Status: ${c.status}`).join('\n')}

SCORING RUBRIC (Each debater is scored out of 100 points):
1. Argumentation (30 max): Quality of premises, evidence, relevance, internal logic.
2. Rebuttal & Engagement (30 max): Direct response to opponent's points. Penalize unaddressed/dropped points severely.
3. Clarity & Structure (20 max): Signposting, pacing, rhetorical precision, audience legibility.
4. Composure & Rules (10 max): Time discipline, avoiding ad-hominem, intellectual honesty.
5. Factual Grounding (10 max): Plausibility of empirical assertions, epistemic caution.

OUTPUT STRICT JSON WITH THIS SCHEMA:
{
  "p1Scorecard": {
    "argumentation": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "rebuttal": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "clarity": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "composure": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "factualGrounding": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "totalScore": number
  },
  "p2Scorecard": {
    "argumentation": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "rebuttal": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "clarity": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "composure": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "factualGrounding": { "score": number, "comment": "string", "evidenceQuotes": ["string"] },
    "totalScore": number
  },
  "theSecond": {
    "winner": "P1" | "P2" | "DRAW",
    "marginText": "e.g. +4 points (86 to 82)",
    "keySummary": "One crisp sentence explaining who won the round and why.",
    "p1Highlights": {
      "strongestMove": "Most effective argument or counter-punch with quote",
      "criticalDroppedPoint": "Key opponent point left completely unanswered or 'None dropped'",
      "nextRoundTacticalAdjustment": "Immediate tactical advice for Round ${params.roundNumber + 1}"
    },
    "p2Highlights": {
      "strongestMove": "Most effective argument or counter-punch with quote",
      "criticalDroppedPoint": "Key opponent point left completely unanswered or 'None dropped'",
      "nextRoundTacticalAdjustment": "Immediate tactical advice for Round ${params.roundNumber + 1}"
    }
  }
}`;
}
