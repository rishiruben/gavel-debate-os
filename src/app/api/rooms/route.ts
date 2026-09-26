import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '@/lib/state/debate-store';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, proposition, formatName, mode, p1Name, p2Name, p1Role, p2Role } = body;

    const roomId = nanoid(8);
    const room = getOrCreateRoom(roomId, {
      id: roomId,
      title: title || (mode === 'PODCAST' ? 'Live Podcast Discussion' : 'Live Moderated Debate'),
      proposition: proposition || 'Resolved: Open source AI is more beneficial than closed proprietary AI.',
      formatName: formatName || (mode === 'PODCAST' ? 'Interactive Podcast Sidekick' : 'Standard 3-Round Format'),
      mode: mode || 'DEBATE',
      participants: {
        p1: {
          id: 'p1',
          name: p1Name || (mode === 'PODCAST' ? 'Host' : 'Alex Chen'),
          role: p1Role || (mode === 'PODCAST' ? 'Host' : 'Speaker 1'),
          side: p1Role || (mode === 'PODCAST' ? 'Host' : 'Speaker 1'),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          isReady: true,
          isMuted: false,
          scoreTotal: 0,
          speakingTimeSeconds: 0,
        },
        p2: {
          id: 'p2',
          name: p2Name || (mode === 'PODCAST' ? 'Guest' : 'Marcus Vance'),
          role: p2Role || (mode === 'PODCAST' ? 'Guest' : 'Speaker 2'),
          side: p2Role || (mode === 'PODCAST' ? 'Guest' : 'Speaker 2'),
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          isReady: true,
          isMuted: false,
          scoreTotal: 0,
          speakingTimeSeconds: 0,
        },
      },
    });

    return NextResponse.json({ success: true, roomId, room });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
