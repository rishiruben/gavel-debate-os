export type DebatePhase =
  | 'LOBBY'
  | 'READINESS_CHECK'
  | 'ROUND_INTRO'
  | 'SPEAKER_TURN'
  | 'CROSS_EXAMINATION'
  | 'THE_SECOND_JUDGING'
  | 'FINAL_DECISION';

export type ShowMode = 'DEBATE' | 'PODCAST';

export interface Participant {
  id: string;
  name: string;
  role: string; // e.g. "Speaker 1", "Speaker 2", "Host", "Guest", "Affirmative", "Negative"
  side?: string; // backwards compatibility
  avatar?: string;
  isReady: boolean;
  isMuted: boolean;
  scoreTotal: number;
  speakingTimeSeconds?: number;
}

export interface Claim {
  id: string;
  roundNumber: number;
  speakerId: string;
  speakerName: string;
  timestamp: string;
  text: string;
  status: 'ASSERTED' | 'REBUTTED' | 'DROPPED' | 'VERIFIED' | 'DISPUTED';
  rebuttedBy?: string;
  rebuttalSnippet?: string;
  factCheckStatus?: 'UNVERIFIED' | 'SUPPORTED' | 'DISPUTED';
}

export interface LookupItem {
  id: string;
  query: string;
  summary: string;
  source: string;
  isVerified: boolean;
  timestamp: string;
  speakerName?: string;
}

export interface RubricDimension {
  name: string;
  maxPoints: number;
  score: number;
  comment: string;
  evidenceQuotes: string[];
}

export interface RubricScorecard {
  roundNumber: number;
  participantId: string;
  argumentation: RubricDimension;     // 30 pts
  rebuttal: RubricDimension;          // 30 pts
  clarity: RubricDimension;           // 20 pts
  composure: RubricDimension;         // 10 pts
  factualGrounding: RubricDimension;  // 10 pts
  totalScore: number;                 // sum out of 100
}

export interface TheSecondFeedback {
  roundNumber: number;
  winnerParticipantId: string | 'DRAW';
  winnerName: string;
  marginText: string;
  keySummary: string;
  p1Highlights: {
    strongestMove: string;
    criticalDroppedPoint: string;
    nextRoundTacticalAdjustment: string;
  };
  p2Highlights: {
    strongestMove: string;
    criticalDroppedPoint: string;
    nextRoundTacticalAdjustment: string;
  };
  isReleasedToAir: boolean;
  createdAt: number;
}

export interface DebateRound {
  number: number;
  name: string;
  durationSeconds: number;
  turnDurationSeconds: number; // e.g., 60s per speaker
  activeSpeakerId: string | null;
  timeRemainingSeconds: number;
  scorecards?: {
    [participantId: string]: RubricScorecard;
  };
  theSecond?: TheSecondFeedback;
}

export interface AudienceVoteState {
  roundNumber: number;
  p1Votes: number;
  p2Votes: number;
  totalVotes: number;
  audienceWinnerId: string | null;
}

export interface LemonadeConfig {
  baseUrl: string; // e.g. http://localhost:8000/v1
  apiKey: string;
  model: string;   // e.g. llama-3.3-70b or default
  isConnected: boolean;
  latencyMs: number;
  useFallbackSimulation: boolean;
}

export interface DebateState {
  id: string;
  title: string;
  proposition: string;
  formatName: string;
  mode: ShowMode;
  totalRounds: number;
  currentRoundIndex: number;
  currentPhase: DebatePhase;
  isRunning: boolean;
  isPaused: boolean;
  participants: {
    p1: Participant;
    p2: Participant;
  };
  rounds: DebateRound[];
  claims: Claim[];
  lookups: LookupItem[];
  transcript: {
    id: string;
    speakerId: string;
    speakerName: string;
    text: string;
    timestamp: string;
    roundNumber: number;
  }[];
  audienceVotes: AudienceVoteState;
  finalWinnerId: string | null;
  finalDecisionRationale: string | null;
}
