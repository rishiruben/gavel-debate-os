'use client';

import React, { useState, useEffect, use } from 'react';
import { DebateState } from '@/types/debate';
import { Gavel, Vote, Flame, Sparkles, Brain, Check, BarChart2 } from 'lucide-react';

export default function AudienceCompanion({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const [room, setRoom] = useState<DebateState | null>(null);
  const [votedSide, setVotedSide] = useState<'p1' | 'p2' | null>(null);
  const [reactionBurst, setReactionBurst] = useState<string | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
        }
      } catch (e) {
        console.error('Error fetching vote state:', e);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [roomId]);

  const castVote = async (side: 'p1' | 'p2') => {
    setVotedSide(side);
    await fetch(`/api/rooms/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'castVote',
        payload: { participantId: side },
      }),
    });
  };

  const triggerReaction = (emoji: string) => {
    setReactionBurst(emoji);
    setTimeout(() => setReactionBurst(null), 1200);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-sm font-semibold">Loading Live Ballot...</span>
        </div>
      </div>
    );
  }

  const currentRound = room.rounds[room.currentRoundIndex];
  const votes = room.audienceVotes;
  const p1Percent = votes.totalVotes > 0 ? Math.round((votes.p1Votes / votes.totalVotes) * 100) : 50;
  const p2Percent = 100 - p1Percent;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Top Header */}
      <header className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
            <Gavel className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white">GAVEL AUDIENCE</span>
            <span className="text-[10px] text-amber-400 block uppercase font-bold">Live Stream Ballot</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Round</span>
          <span className="text-xs font-black text-amber-400">
            {currentRound?.number || 1} of {room.totalRounds}
          </span>
        </div>
      </header>

      {/* Main Voting Card */}
      <main className="space-y-5 my-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Debate Resolution
          </span>
          <p className="text-sm font-bold text-slate-200">
            {room.proposition}
          </p>
        </div>

        {/* Voting Action */}
        <div className="space-y-3">
          <div className="text-center">
            <h2 className="text-base font-extrabold text-white">Who is winning this round?</h2>
            <p className="text-xs text-slate-400">Cast your vote to shape the live broadcast score</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* P1 Button */}
            <button
              onClick={() => castVote('p1')}
              className={`p-4 rounded-2xl border-2 transition text-left flex flex-col justify-between ${
                votedSide === 'p1'
                  ? 'bg-blue-950/80 border-blue-400 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400 block">Affirmative</span>
                <span className="text-sm font-bold text-white block mt-0.5">{room.participants.p1.name}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">{votes.p1Votes} votes</span>
                {votedSide === 'p1' && <Check className="w-4 h-4 text-blue-400 stroke-[3]" />}
              </div>
            </button>

            {/* P2 Button */}
            <button
              onClick={() => castVote('p2')}
              className={`p-4 rounded-2xl border-2 transition text-left flex flex-col justify-between ${
                votedSide === 'p2'
                  ? 'bg-rose-950/80 border-rose-400 shadow-lg shadow-rose-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase text-rose-400 block">Negative</span>
                <span className="text-sm font-bold text-white block mt-0.5">{room.participants.p2.name}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">{votes.p2Votes} votes</span>
                {votedSide === 'p2' && <Check className="w-4 h-4 text-rose-400 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Live Audience Tally Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-blue-400">{room.participants.p1.name} ({p1Percent}%)</span>
            <span className="text-rose-400">{room.participants.p2.name} ({p2Percent}%)</span>
          </div>

          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 transition-all duration-300" style={{ width: `${p1Percent}%` }} />
            <div className="bg-rose-500 transition-all duration-300" style={{ width: `${p2Percent}%` }} />
          </div>

          <div className="text-center pt-1 text-[11px] text-slate-400">
            Total Live Ballots: <span className="font-mono font-bold text-slate-200">{votes.totalVotes}</span>
          </div>
        </div>

        {/* Live Reactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-2 relative">
          {reactionBurst && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl animate-bounce pointer-events-none z-20">
              {reactionBurst}
            </div>
          )}
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Crowd Reactions</span>
          <div className="flex justify-center gap-4 text-2xl pt-1">
            <button onClick={() => triggerReaction('🔥')} className="hover:scale-125 transition active:scale-95">🔥</button>
            <button onClick={() => triggerReaction('⚖️')} className="hover:scale-125 transition active:scale-95">⚖️</button>
            <button onClick={() => triggerReaction('🧠')} className="hover:scale-125 transition active:scale-95">🧠</button>
            <button onClick={() => triggerReaction('💥')} className="hover:scale-125 transition active:scale-95">💥</button>
            <button onClick={() => triggerReaction('👏')} className="hover:scale-125 transition active:scale-95">👏</button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 pt-3 text-center text-[10px] text-slate-600">
        Gavel Ballot • Room {roomId}
      </footer>
    </div>
  );
}
