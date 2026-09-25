import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom, advanceRoundPhase } from '@/lib/state/debate-store';
import { nanoid } from 'nanoid';

const SIMULATION_SCRIPTS = [
  {
    topic: 'Resolved: AI code generation will eliminate junior software engineers by 2028.',
    p1: 'Alex Chen',
    p2: 'Marcus Vance',
    rounds: [
      {
        roundNumber: 1,
        p1Speech: 'Ladies and gentlemen, the economic fundamentals of software engineering have broken. In 2026, autonomous agentic systems write, test, and debug 80% of boilerplate code. Junior engineers have historically served as code apprentices who handle maintenance and straightforward features. When that substrate of work is handled for pennies on the dollar by models, tech firms will stop hiring entry-level talent altogether. The apprenticeship model is dead.',
        p2Speech: 'My opponent makes the classic fallacy of the lump of labor. When the cost of producing software falls by 90%, the demand for software does not stay constant—it explodes exponentially. Every small business, municipal agency, and research lab now needs custom software systems. Junior engineers will not disappear; their baseline responsibility shifts from typing syntax to system specification, edge-case evaluation, and human-in-the-loop verification.',
      },
      {
        roundNumber: 2,
        p2Speech: 'Alex failed to answer my primary point on Jevons Paradox. Look at the data: cloud computing was predicted to eliminate IT system administrators. Instead, it spawned site reliability engineering and DevOps, multiplying the headcount. Claiming entry-level roles disappear ignores that every senior architect must start somewhere. Companies that stop hiring juniors will face catastrophic institutional brain-drain within five years.',
        p1Speech: 'Marcus points to Jevons Paradox, but misapplies it to labor cognition. Cloud servers did not think; AI does. The empirical truth is that companies are already flattening their pyramids. A team of two senior engineers with AI agents now outproduces a former 10-person squad. Where are the juniors in that math? Marcus has offered optimism without pointing to a single enterprise budgeting line that justifies entry-level overhead.',
      }
    ]
  }
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, step } = body;
    const room = getOrCreateRoom(roomId);
    const script = SIMULATION_SCRIPTS[0];

    if (step === 'loadScript') {
      room.proposition = script.topic;
      room.participants.p1.name = script.p1;
      room.participants.p2.name = script.p2;
      return NextResponse.json({ success: true, room });
    }

    if (step === 'simulateRound1') {
      const r1 = script.rounds[0];
      room.currentRoundIndex = 0;
      room.currentPhase = 'SPEAKER_TURN';
      room.isRunning = true;

      // Add P1 speech
      room.transcript.push({
        id: nanoid(),
        speakerId: 'p1',
        speakerName: room.participants.p1.name,
        text: r1.p1Speech,
        timestamp: '00:01:15',
        roundNumber: 1,
      });

      room.claims.push({
        id: nanoid(),
        roundNumber: 1,
        speakerId: 'p1',
        speakerName: room.participants.p1.name,
        timestamp: '00:01:20',
        text: 'Autonomous agents already generate and debug 80% of routine code.',
        status: 'ASSERTED',
        factCheckStatus: 'SUPPORTED',
      });

      room.claims.push({
        id: nanoid(),
        roundNumber: 1,
        speakerId: 'p1',
        speakerName: room.participants.p1.name,
        timestamp: '00:01:45',
        text: 'The economic incentive for corporate apprentice programs has collapsed.',
        status: 'ASSERTED',
        factCheckStatus: 'SUPPORTED',
      });

      // Add P2 speech
      room.transcript.push({
        id: nanoid(),
        speakerId: 'p2',
        speakerName: room.participants.p2.name,
        text: r1.p2Speech,
        timestamp: '00:02:15',
        roundNumber: 1,
      });

      room.claims.push({
        id: nanoid(),
        roundNumber: 1,
        speakerId: 'p2',
        speakerName: room.participants.p2.name,
        timestamp: '00:02:22',
        text: 'Jevons paradox dictates cheaper software production induces exponential demand for builders.',
        status: 'REBUTTED',
        rebuttedBy: room.participants.p2.name,
        factCheckStatus: 'SUPPORTED',
      });

      // Advance to judging break and evaluate
      await advanceRoundPhase(roomId, 'THE_SECOND_JUDGING');

      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ success: false, message: 'Unknown step' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
