import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '@/lib/state/debate-store';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, proposition, formatName, p1Name, p2Name } = body;

    const roomId = nanoid(8);
    const room = getOrCreateRoom(roomId, {
      id: roomId,
      title: title || 'Live AI-Judged Debate',
      proposition: proposition || 'Resolved: Open source AI is more beneficial than closed proprietary AI.',
      formatName: formatName || 'Standard 3-Round Collegiate',
      participants: {
        p1: {
          id: 'p1',
          name: p1Name || 'Affirmative Speaker',
          side: 'AFFIRMATIVE',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          isReady: true,
          isMuted: false,
          scoreTotal: 0,
        },
        p2: {
          id: 'p2',
          name: p2Name || 'Negative Speaker',
          side: 'NEGATIVE',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          isReady: true,
          isMuted: false,
          scoreTotal: 0,
        },
      },
    });

    return NextResponse.json({ success: true, roomId, room });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
