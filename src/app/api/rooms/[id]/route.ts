import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom, advanceRoundPhase, updateRoom } from '@/lib/state/debate-store';
import { nanoid } from 'nanoid';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const room = getOrCreateRoom(id);
  return NextResponse.json(room);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, payload } = body;

  const room = getOrCreateRoom(id);

  switch (action) {
    case 'advancePhase': {
      await advanceRoundPhase(id, payload?.targetPhase);
      break;
    }

    case 'togglePause': {
      room.isPaused = !room.isPaused;
      break;
    }

    case 'addTime': {
      const currentRound = room.rounds[room.currentRoundIndex];
      if (currentRound) {
        currentRound.timeRemainingSeconds = Math.max(0, currentRound.timeRemainingSeconds + (payload?.seconds || 30));
      }
      break;
    }

    case 'tickTimer': {
      // Periodic timer countdown when running and not paused
      if (room.isRunning && !room.isPaused) {
        const currentRound = room.rounds[room.currentRoundIndex];
        if (currentRound && currentRound.timeRemainingSeconds > 0) {
          currentRound.timeRemainingSeconds -= 1;
        }
      }
      break;
    }

    case 'switchSpeaker': {
      const currentRound = room.rounds[room.currentRoundIndex];
      if (currentRound) {
        currentRound.activeSpeakerId = payload?.speakerId || (currentRound.activeSpeakerId === 'p1' ? 'p2' : 'p1');
        currentRound.timeRemainingSeconds = currentRound.turnDurationSeconds;
      }
      break;
    }

    case 'addSpeech': {
      const { speakerId, text } = payload;
      const speaker = speakerId === 'p1' ? room.participants.p1 : room.participants.p2;
      const currentRound = room.rounds[room.currentRoundIndex];

      const entry = {
        id: nanoid(),
        speakerId,
        speakerName: speaker.name,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        roundNumber: currentRound.number,
      };
      room.transcript.push(entry);

      // Auto-extract a high-level claim if text is substantial
      if (text.length > 25) {
        const claimText = text.length > 120 ? text.substring(0, 117) + '...' : text;
        const opponentSpeakerId = speakerId === 'p1' ? 'p2' : 'p1';

        // Check if this sounds like a rebuttal or a fresh assertion
        const isRebuttal = text.toLowerCase().includes('disagree') ||
          text.toLowerCase().includes('however') ||
          text.toLowerCase().includes('wrong') ||
          text.toLowerCase().includes('contrary') ||
          text.toLowerCase().includes('fallacy');

        room.claims.push({
          id: nanoid(),
          roundNumber: currentRound.number,
          speakerId,
          speakerName: speaker.name,
          timestamp: entry.timestamp,
          text: claimText,
          status: isRebuttal ? 'REBUTTED' : 'ASSERTED',
          rebuttedBy: isRebuttal ? speaker.name : undefined,
          factCheckStatus: Math.random() > 0.4 ? 'SUPPORTED' : 'UNVERIFIED',
        });
      }
      break;
    }

    case 'releaseFeedback': {
      const currentRound = room.rounds[room.currentRoundIndex];
      if (currentRound?.theSecond) {
        currentRound.theSecond.isReleasedToAir = true;
      }
      break;
    }

    case 'castVote': {
      const { participantId } = payload;
      if (participantId === 'p1') {
        room.audienceVotes.p1Votes += 1;
      } else if (participantId === 'p2') {
        room.audienceVotes.p2Votes += 1;
      }
      room.audienceVotes.totalVotes = room.audienceVotes.p1Votes + room.audienceVotes.p2Votes;
      if (room.audienceVotes.p1Votes > room.audienceVotes.p2Votes) {
        room.audienceVotes.audienceWinnerId = 'p1';
      } else if (room.audienceVotes.p2Votes > room.audienceVotes.p1Votes) {
        room.audienceVotes.audienceWinnerId = 'p2';
      } else {
        room.audienceVotes.audienceWinnerId = null;
      }
      break;
    }

    case 'reset': {
      room.currentRoundIndex = 0;
      room.currentPhase = 'LOBBY';
      room.isRunning = false;
      room.isPaused = false;
      room.participants.p1.scoreTotal = 0;
      room.participants.p2.scoreTotal = 0;
      room.transcript = [];
      room.claims = [];
      room.finalWinnerId = null;
      room.finalDecisionRationale = null;
      room.rounds.forEach(r => {
        r.timeRemainingSeconds = r.turnDurationSeconds;
        r.activeSpeakerId = 'p1';
        r.scorecards = undefined;
        r.theSecond = undefined;
      });
      break;
    }
  }

  return NextResponse.json(room);
}
