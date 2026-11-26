import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom, advanceRoundPhase, updateRoom } from '@/lib/state/debate-store';
import { LemonadeClient } from '@/lib/ai/lemonade-client';
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

      // Extract claims using local Lemonade Server
      if (text.length > 20) {
        const client = new LemonadeClient();
        const priorOpponentClaims = room.claims
          .filter(c => c.speakerId !== speakerId)
          .slice(-5)
          .map(c => ({ speakerName: c.speakerName, text: c.text }));

        const extracted = await client.extractClaims({
          proposition: room.proposition,
          speakerName: speaker.name,
          text,
          existingClaims: priorOpponentClaims,
        });

        for (const c of extracted.claims.slice(0, 3)) {
          const isRebuttal = c.rebutsPriorClaimIndex !== null && c.rebutsPriorClaimIndex !== undefined;
          room.claims.push({
            id: nanoid(),
            roundNumber: currentRound.number,
            speakerId,
            speakerName: speaker.name,
            timestamp: entry.timestamp,
            text: c.text,
            status: isRebuttal ? 'REBUTTED' : 'ASSERTED',
            rebuttedBy: isRebuttal ? speaker.name : undefined,
            factCheckStatus: c.category === 'FACTUAL' ? 'UNVERIFIED' : undefined,
          });
        }

        // Podcast Sidekick: Run a real Lemonade lookup if numbers, stats, or studies are mentioned
        if (text.match(/\d+|percent|%|study|data|research|market|dollar|\$/i)) {
          if (!room.lookups) room.lookups = [];
          const lookupResult = await client.lookupFact(text, room.proposition);
          room.lookups.unshift({
            id: nanoid(),
            query: text.length > 60 ? text.substring(0, 57) + '...' : text,
            summary: lookupResult.summary,
            source: lookupResult.source,
            isVerified: lookupResult.isVerified,
            timestamp: entry.timestamp,
            speakerName: speaker.name,
          });
        }
      }
      break;
    }

    case 'addLookup': {
      if (!room.lookups) room.lookups = [];
      const query = payload?.query || 'Manual Query';
      const client = new LemonadeClient();
      const lookupResult = await client.lookupFact(query, room.proposition);
      room.lookups.unshift({
        id: nanoid(),
        query,
        summary: lookupResult.summary,
        source: lookupResult.source,
        isVerified: lookupResult.isVerified,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
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
