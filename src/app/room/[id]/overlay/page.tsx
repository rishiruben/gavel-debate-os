'use client';

import React, { useState, useEffect, use } from 'react';
import { DebateState } from '@/types/debate';
import { Gavel, Mic, AlertCircle, CheckCircle2, Trophy, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OBSBroadcastOverlay({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const [room, setRoom] = useState<DebateState | null>(null);
  const [confettiFired, setConfettiFired] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
        }
      } catch (e) {
        console.error('Error fetching overlay state:', e);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Fire victory confetti when final decision is reached
  useEffect(() => {
    if (room?.currentPhase === 'FINAL_DECISION' && !confettiFired) {
      setConfettiFired(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#3B82F6', '#EF4444', '#10B981'],
      });
    }
  }, [room?.currentPhase, confettiFired]);

  if (!room) return <div className="obs-transparent-canvas min-h-screen" />;

  const currentRound = room.rounds[room.currentRoundIndex];
  const isP1Speaking = currentRound?.activeSpeakerId === 'p1';
  const isP2Speaking = currentRound?.activeSpeakerId === 'p2';
  const theSecond = currentRound?.theSecond;
  const isJudgingBreak = room.currentPhase === 'THE_SECOND_JUDGING' && theSecond?.isReleasedToAir;
  const isFinalDecision = room.currentPhase === 'FINAL_DECISION';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="obs-transparent-canvas min-h-screen w-screen p-8 flex flex-col justify-between select-none font-display overflow-hidden relative">
      {/* Top Broadcast Bar (Header) */}
      <div className="w-full flex items-center justify-between">
        {/* Left: Brand Badge & Proposition */}
        <div className="flex items-center gap-3">
          <div className="h-11 px-4 rounded-xl bg-slate-950/90 border border-amber-500/40 backdrop-blur-md flex items-center gap-2.5 shadow-2xl">
            <div className="h-6 w-6 rounded-md bg-amber-500 flex items-center justify-center text-slate-950 font-black">
              <Gavel className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="font-extrabold tracking-tight text-white text-sm">GAVEL</span>
            <span className="h-3 w-px bg-slate-700" />
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              AI MODERATED
            </span>
          </div>

          <div className="h-11 px-5 rounded-xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md flex items-center text-xs font-semibold text-slate-200 max-w-2xl truncate shadow-2xl">
            <span className="text-amber-400 font-bold mr-2 uppercase tracking-wider text-[10px]">Topic:</span>
            <span className="truncate">{room.proposition}</span>
          </div>
        </div>

        {/* Right: Round & Master Countdown Timer */}
        <div className="flex items-center gap-3">
          <div className="h-11 px-4 rounded-xl bg-slate-950/85 border border-slate-800 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-slate-300 shadow-2xl">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Round</span>
            <span className="text-amber-400 text-sm font-black">{currentRound?.number || 1}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{room.totalRounds}</span>
          </div>

          {/* Glowing Timer */}
          <div className={`h-11 px-5 rounded-xl border backdrop-blur-md flex items-center gap-2 shadow-2xl font-mono text-xl font-black transition-all ${
            (currentRound?.timeRemainingSeconds || 0) <= 10 && room.isRunning && !room.isPaused
              ? 'bg-rose-950/90 border-rose-500 text-rose-400 animate-pulse'
              : 'bg-slate-950/90 border-amber-500/40 text-amber-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1" />
            {formatTime(currentRound?.timeRemainingSeconds || 0)}
          </div>
        </div>
      </div>

      {/* Center Stage Overlay: "THE SECOND" Coaching Card or Final Decision Card */}
      {isJudgingBreak && theSecond && (
        <div className="my-auto mx-auto max-w-4xl w-full bg-slate-950/95 border-2 border-amber-500/50 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30">
                <Gavel className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-white">THE SECOND</h2>
                  <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Corner Breakdown
                  </span>
                </div>
                <p className="text-xs text-slate-400">AI Referee Judgment & Round {theSecond.roundNumber} Analysis</p>
              </div>
            </div>

            {/* Margin Tag */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Round Decision</span>
              <span className="text-base font-black text-amber-400">{theSecond.marginText}</span>
            </div>
          </div>

          {/* Winner Callout */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center mb-6">
            <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">Round Winner</span>
            <div className="text-2xl font-black text-white mt-0.5">{theSecond.winnerName}</div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl mx-auto italic font-medium">
              &ldquo;{theSecond.keySummary}&rdquo;
            </p>
          </div>

          {/* Debater Highlights Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* P1 Corner */}
            <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                <span className="font-extrabold text-blue-400 text-sm">🔵 {room.participants.p1.name}</span>
                <span className="text-[11px] font-bold text-blue-300">AFFIRMATIVE</span>
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-emerald-400 font-bold block mb-0.5">⚡ Strongest Move:</span>
                {theSecond.p1Highlights.strongestMove}
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-rose-400 font-bold block mb-0.5">⚠️ Dropped Argument:</span>
                {theSecond.p1Highlights.criticalDroppedPoint}
              </div>
              <div className="text-xs text-amber-300 font-medium pt-1 border-t border-slate-800">
                <span className="font-bold block mb-0.5">🥊 Corner Adjustment:</span>
                {theSecond.p1Highlights.nextRoundTacticalAdjustment}
              </div>
            </div>

            {/* P2 Corner */}
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <span className="font-extrabold text-rose-400 text-sm">🔴 {room.participants.p2.name}</span>
                <span className="text-[11px] font-bold text-rose-300">NEGATIVE</span>
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-emerald-400 font-bold block mb-0.5">⚡ Strongest Move:</span>
                {theSecond.p2Highlights.strongestMove}
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-rose-400 font-bold block mb-0.5">⚠️ Dropped Argument:</span>
                {theSecond.p2Highlights.criticalDroppedPoint}
              </div>
              <div className="text-xs text-amber-300 font-medium pt-1 border-t border-slate-800">
                <span className="font-bold block mb-0.5">🥊 Corner Adjustment:</span>
                {theSecond.p2Highlights.nextRoundTacticalAdjustment}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center Stage: Final Decision Card */}
      {isFinalDecision && (
        <div className="my-auto mx-auto max-w-2xl w-full bg-slate-950/95 border-2 border-amber-500 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 mx-auto mb-4 shadow-xl shadow-amber-500/40">
            <Trophy className="w-9 h-9 stroke-[2.5]" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            Official Gavel Verdict
          </span>
          <h2 className="text-4xl font-black text-white mt-1">
            {room.finalWinnerId === 'p1' ? room.participants.p1.name : room.participants.p2.name} Wins!
          </h2>
          <p className="text-sm text-slate-300 mt-3 max-w-lg mx-auto leading-relaxed">
            {room.finalDecisionRationale}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-center gap-8">
            <div className="text-center">
              <span className="text-xs text-blue-400 font-bold uppercase">{room.participants.p1.name}</span>
              <div className="text-2xl font-black text-white">{room.participants.p1.scoreTotal} pts</div>
            </div>
            <div className="text-slate-600 font-black text-lg">VS</div>
            <div className="text-center">
              <span className="text-xs text-rose-400 font-bold uppercase">{room.participants.p2.name}</span>
              <div className="text-2xl font-black text-white">{room.participants.p2.scoreTotal} pts</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Lower Thirds: Debater 1 & Debater 2 Bars */}
      <div className="w-full grid grid-cols-2 gap-8 items-end">
        {/* Debater 1 (Affirmative - Blue) */}
        <div className={`rounded-2xl p-4 transition-all duration-300 border shadow-2xl backdrop-blur-md flex items-center justify-between ${
          isP1Speaking 
            ? 'bg-blue-950/90 border-blue-400 shadow-blue-500/20 scale-[1.02]' 
            : 'bg-slate-950/80 border-slate-800 opacity-90'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white border ${
              isP1Speaking ? 'bg-blue-600 border-blue-300 animate-pulse' : 'bg-slate-800 border-slate-700'
            }`}>
              {room.participants.p1.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">{room.participants.p1.name}</span>
                {isP1Speaking && (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500 text-slate-950">
                    <Mic className="w-3 h-3" /> Speaking
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold uppercase text-blue-400 tracking-wider">
                {room.participants.p1.role || 'Speaker 1'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Score</span>
            <span className="font-mono text-2xl font-black text-blue-300">
              {room.participants.p1.scoreTotal}
            </span>
          </div>
        </div>

        {/* Debater 2 */}
        <div className={`rounded-2xl p-4 transition-all duration-300 border shadow-2xl backdrop-blur-md flex items-center justify-between ${
          isP2Speaking 
            ? 'bg-amber-950/90 border-amber-400 shadow-amber-500/20 scale-[1.02]' 
            : 'bg-slate-950/80 border-slate-800 opacity-90'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white border ${
              isP2Speaking ? 'bg-amber-600 border-amber-300 animate-pulse' : 'bg-slate-800 border-slate-700'
            }`}>
              {room.participants.p2.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">{room.participants.p2.name}</span>
                {isP2Speaking && (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                    <Mic className="w-3 h-3" /> Speaking
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
                {room.participants.p2.role || 'Speaker 2'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Score</span>
            <span className="font-mono text-2xl font-black text-amber-300">
              {room.participants.p2.scoreTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Live Sidekick Fact Card (if any lookups exist) */}
      {room.lookups && room.lookups.length > 0 && !isJudgingBreak && !isFinalDecision && (
        <div className="absolute bottom-28 left-8 max-w-md bg-slate-950/90 border border-emerald-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
              Live Sidekick Fact Check
            </span>
            <span className="text-[10px] text-slate-500">• {room.lookups[0].timestamp}</span>
          </div>
          <div className="text-xs font-bold text-white mb-0.5">{room.lookups[0].query}</div>
          <p className="text-[11px] text-slate-300 line-clamp-2">{room.lookups[0].summary}</p>
        </div>
      )}
    </div>
  );
}
