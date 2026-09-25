import { DebateState, DebatePhase, Claim, TheSecondFeedback, RubricScorecard } from '@/types/debate';
import { LemonadeClient } from '@/lib/ai/lemonade-client';

// Global in-memory storage for active debate rooms
const rooms = new Map<string, DebateState>();

export function getOrCreateRoom(id: string, initialProps?: Partial<DebateState>): DebateState {
  if (rooms.has(id)) {
    return rooms.get(id)!;
  }

  const defaultRoom: DebateState = {
    id,
    title: initialProps?.title || 'Championship Live Debate',
    proposition: initialProps?.proposition || 'Resolved: Artificial Intelligence code generation will obsolete human software engineers by 2028.',
    formatName: initialProps?.formatName || 'Standard 3-Round Collegiate',
    totalRounds: 3,
    currentRoundIndex: 0,
    currentPhase: 'LOBBY',
    isRunning: false,
    isPaused: false,
    participants: {
      p1: {
        id: 'p1',
        name: initialProps?.participants?.p1?.name || 'Alex Chen',
        side: 'AFFIRMATIVE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isReady: true,
        isMuted: false,
        scoreTotal: 0,
      },
      p2: {
        id: 'p2',
        name: initialProps?.participants?.p2?.name || 'Marcus Vance',
        side: 'NEGATIVE',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        isReady: true,
        isMuted: false,
        scoreTotal: 0,
      },
    },
    rounds: [
      {
        number: 1,
        name: 'Opening Constructives',
        durationSeconds: 120,
        turnDurationSeconds: 60,
        activeSpeakerId: 'p1',
        timeRemainingSeconds: 60,
      },
      {
        number: 2,
        name: 'Rebuttal & Cross-Examination',
        durationSeconds: 120,
        turnDurationSeconds: 60,
        activeSpeakerId: 'p2',
        timeRemainingSeconds: 60,
      },
      {
        number: 3,
        name: 'Final Closings & Summary',
        durationSeconds: 120,
        turnDurationSeconds: 60,
        activeSpeakerId: 'p1',
        timeRemainingSeconds: 60,
      },
    ],
    claims: [],
    transcript: [],
    audienceVotes: {
      roundNumber: 1,
      p1Votes: 12,
      p2Votes: 14,
      totalVotes: 26,
      audienceWinnerId: null,
    },
    finalWinnerId: null,
    finalDecisionRationale: null,
    ...initialProps,
  };

  rooms.set(id, defaultRoom);
  return defaultRoom;
}

export function getRoom(id: string): DebateState | undefined {
  return rooms.get(id);
}

export function updateRoom(id: string, updater: (room: DebateState) => void): DebateState {
  const room = getOrCreateRoom(id);
  updater(room);
  return room;
}

export async function advanceRoundPhase(roomId: string, targetPhase?: DebatePhase): Promise<DebateState> {
  const room = getOrCreateRoom(roomId);
  const currentRound = room.rounds[room.currentRoundIndex];

  if (targetPhase) {
    room.currentPhase = targetPhase;
    if (targetPhase === 'THE_SECOND_JUDGING') {
      currentRound.timeRemainingSeconds = 60;
      await runRoundJudging(roomId, currentRound.number);
    } else if (targetPhase === 'FINAL_DECISION') {
      calculateFinalVerdict(room);
    }
  } else {
    // Phase progression logic
    switch (room.currentPhase) {
      case 'LOBBY':
        room.currentPhase = 'READINESS_CHECK';
        break;
      case 'READINESS_CHECK':
        room.currentPhase = 'ROUND_INTRO';
        room.isRunning = true;
        break;
      case 'ROUND_INTRO':
        room.currentPhase = 'SPEAKER_TURN';
        currentRound.activeSpeakerId = 'p1';
        currentRound.timeRemainingSeconds = currentRound.turnDurationSeconds;
        break;
      case 'SPEAKER_TURN':
        if (currentRound.activeSpeakerId === 'p1') {
          currentRound.activeSpeakerId = 'p2';
          currentRound.timeRemainingSeconds = currentRound.turnDurationSeconds;
        } else {
          // Both speakers finished their constructive turn -> Move to cross or judging
          if (room.currentRoundIndex === 1) {
            room.currentPhase = 'CROSS_EXAMINATION';
            currentRound.timeRemainingSeconds = 60;
          } else {
            room.currentPhase = 'THE_SECOND_JUDGING';
            currentRound.timeRemainingSeconds = 60;
            await runRoundJudging(roomId, currentRound.number);
          }
        }
        break;
      case 'CROSS_EXAMINATION':
        room.currentPhase = 'THE_SECOND_JUDGING';
        currentRound.timeRemainingSeconds = 60;
        await runRoundJudging(roomId, currentRound.number);
        break;
      case 'THE_SECOND_JUDGING':
        if (room.currentRoundIndex < room.totalRounds - 1) {
          room.currentRoundIndex += 1;
          const nextRound = room.rounds[room.currentRoundIndex];
          room.currentPhase = 'ROUND_INTRO';
          nextRound.activeSpeakerId = 'p1';
          nextRound.timeRemainingSeconds = nextRound.turnDurationSeconds;
        } else {
          room.currentPhase = 'FINAL_DECISION';
          calculateFinalVerdict(room);
        }
        break;
      case 'FINAL_DECISION':
        room.isRunning = false;
        break;
    }
  }

  return room;
}

export async function runRoundJudging(roomId: string, roundNumber: number) {
  const room = getOrCreateRoom(roomId);
  const currentRound = room.rounds[roundNumber - 1];

  const client = new LemonadeClient();
  const evaluation = await client.judgeRound({
    proposition: room.proposition,
    roundNumber,
    p1Name: room.participants.p1.name,
    p2Name: room.participants.p2.name,
    transcript: room.transcript.filter(t => t.roundNumber === roundNumber),
    claims: room.claims.filter(c => c.roundNumber === roundNumber),
  });

  const p1Scorecard: RubricScorecard = {
    roundNumber,
    participantId: 'p1',
    argumentation: evaluation.p1Scorecard.argumentation,
    rebuttal: evaluation.p1Scorecard.rebuttal,
    clarity: evaluation.p1Scorecard.clarity,
    composure: evaluation.p1Scorecard.composure,
    factualGrounding: evaluation.p1Scorecard.factualGrounding,
    totalScore: evaluation.p1Scorecard.totalScore,
  };

  const p2Scorecard: RubricScorecard = {
    roundNumber,
    participantId: 'p2',
    argumentation: evaluation.p2Scorecard.argumentation,
    rebuttal: evaluation.p2Scorecard.rebuttal,
    clarity: evaluation.p2Scorecard.clarity,
    composure: evaluation.p2Scorecard.composure,
    factualGrounding: evaluation.p2Scorecard.factualGrounding,
    totalScore: evaluation.p2Scorecard.totalScore,
  };

  const theSecond: TheSecondFeedback = {
    roundNumber,
    winnerParticipantId: evaluation.theSecond.winner === 'P1' ? 'p1' : evaluation.theSecond.winner === 'P2' ? 'p2' : 'DRAW',
    winnerName: evaluation.theSecond.winner === 'P1' ? room.participants.p1.name : evaluation.theSecond.winner === 'P2' ? room.participants.p2.name : 'Draw',
    marginText: evaluation.theSecond.marginText,
    keySummary: evaluation.theSecond.keySummary,
    p1Highlights: evaluation.theSecond.p1Highlights,
    p2Highlights: evaluation.theSecond.p2Highlights,
    isReleasedToAir: true, // Auto-release or toggleable
    createdAt: Date.now(),
  };

  currentRound.scorecards = { p1: p1Scorecard, p2: p2Scorecard };
  currentRound.theSecond = theSecond;

  // Update total scores
  room.participants.p1.scoreTotal += p1Scorecard.totalScore;
  room.participants.p2.scoreTotal += p2Scorecard.totalScore;

  return currentRound;
}

function calculateFinalVerdict(room: DebateState) {
  const p1Total = room.participants.p1.scoreTotal;
  const p2Total = room.participants.p2.scoreTotal;

  if (p1Total > p2Total) {
    room.finalWinnerId = 'p1';
    room.finalDecisionRationale = `${room.participants.p1.name} wins the debate by an aggregate margin of ${p1Total - p2Total} points (${p1Total} to ${p2Total}), demonstrating superior argumentation consistency and surviving cross-examination with fewer dropped points.`;
  } else if (p2Total > p1Total) {
    room.finalWinnerId = 'p2';
    room.finalDecisionRationale = `${room.participants.p2.name} wins the debate by an aggregate margin of ${p2Total - p1Total} points (${p2Total} to ${p1Total}), executing high-impact rebuttals that dismantled the affirmative core model.`;
  } else {
    room.finalWinnerId = 'DRAW';
    room.finalDecisionRationale = `The debate concludes in an unprecedented tie at ${p1Total} points each.`;
  }
}
