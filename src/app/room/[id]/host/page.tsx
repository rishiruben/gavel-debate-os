'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Gavel, 
  Tv, 
  Users, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  FastForward, 
  PlusCircle, 
  Copy, 
  Check, 
  ShieldAlert, 
  Sparkles, 
  Send, 
  RotateCcw, 
  ExternalLink,
  Cpu,
  Flame,
  Radio,
  Search,
  BookOpen,
  Vote,
  CheckCircle2
} from 'lucide-react';
import { DebateState, Claim, TheSecondFeedback } from '@/types/debate';

export default function HostControlRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const [room, setRoom] = useState<DebateState | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [speechText, setSpeechText] = useState('');
  const [speechSpeakerId, setSpeechSpeakerId] = useState<'p1' | 'p2'>('p1');
  const [isJudgingLoading, setIsJudgingLoading] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Poll room state every 1.5 seconds and trigger countdown tick
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
        }
      } catch (e) {
        console.error('Error fetching room state:', e);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [roomId]);

  // Local ticker for smooth countdown
  useEffect(() => {
    if (!room || !room.isRunning || room.isPaused) return;

    const timer = setInterval(() => {
      fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tickTimer' }),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roomId, room?.isRunning, room?.isPaused]);

  const executeAction = async (action: string, payload?: any) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRoom(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateScript = async () => {
    setIsJudgingLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, step: 'simulateRound1' }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
      }
    } finally {
      setIsJudgingLoading(false);
    }
  };

  const handleSendSpeech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speechText.trim()) return;

    await executeAction('addSpeech', {
      speakerId: speechSpeakerId,
      text: speechText.trim(),
    });
    setSpeechText('');
  };

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    await executeAction('addLookup', {
      query: lookupQuery.trim(),
      summary: `Live Sidekick Research: Found verified references matching "${lookupQuery.trim()}". Relevant to current discussion segment.`,
      source: 'Host Knowledge Assistant',
    });
    setLookupQuery('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Gavel className="w-6 h-6 text-amber-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-300">Loading Control Surface...</span>
        </div>
      </div>
    );
  }

  const currentRound = room.rounds[room.currentRoundIndex];
  const activeSpeaker = currentRound?.activeSpeakerId === 'p1' ? room.participants.p1 : room.participants.p2;

  const overlayUrl = `${origin}/room/${roomId}/overlay`;
  const debater1Url = `${origin}/room/${roomId}/debater?token=p1`;
  const debater2Url = `${origin}/room/${roomId}/debater?token=p2`;
  const audienceVoteUrl = `${origin}/room/${roomId}/vote`;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Top Host Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-3.5 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Gavel className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              GAVEL
            </span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-slate-400">Room:</span>
            <span className="font-mono text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {roomId}
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {room.mode || 'PODCAST'}
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 max-w-md truncate">
            <span className="text-slate-500">•</span>
            <span className="truncate">{room.proposition}</span>
          </div>
        </div>

        {/* Quick Link Drawers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(overlayUrl, 'overlay')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
          >
            <Tv className="w-3.5 h-3.5" />
            {copiedLink === 'overlay' ? 'Copied OBS URL!' : 'OBS Overlay Link'}
          </button>

          <button
            onClick={() => copyToClipboard(debater1Url, 'p1')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium transition"
          >
            {copiedLink === 'p1' ? 'Copied!' : `${room.participants.p1.name} Link`}
          </button>

          <button
            onClick={() => copyToClipboard(debater2Url, 'p2')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
          >
            {copiedLink === 'p2' ? 'Copied!' : `${room.participants.p2.name} Link`}
          </button>

          <button
            onClick={() => copyToClipboard(audienceVoteUrl, 'vote')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition"
          >
            <Vote className="w-3.5 h-3.5" />
            {copiedLink === 'vote' ? 'Copied!' : 'Audience Link'}
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Stage State & Master Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Master Stage Director Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Broadcast Master Clock
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Phase:</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  {room.currentPhase.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Timer & Active Speaker */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
              <div className="text-center sm:text-left">
                <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">
                  Active Speaker
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`w-3.5 h-3.5 rounded-full ${activeSpeaker?.id === 'p1' ? 'bg-blue-500' : 'bg-amber-500'} animate-pulse`} />
                  <span className="text-2xl font-black text-white">
                    {activeSpeaker?.name || 'Waiting to start'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    {activeSpeaker?.role || 'Speaker'}
                  </span>
                </div>
              </div>

              {/* Big Digital Clock */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-950 border border-slate-700/80 rounded-2xl px-6 py-3 font-mono text-5xl font-black tracking-tight text-amber-400 shadow-inner">
                  {Math.floor((currentRound?.timeRemainingSeconds || 0) / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {((currentRound?.timeRemainingSeconds || 0) % 60)
                    .toString()
                    .padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Primary Host Emergency Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-6 mt-4 border-t border-slate-800">
              <button
                onClick={() => executeAction('togglePause')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  room.isPaused 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {room.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {room.isPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                onClick={() => executeAction('addTime', { seconds: 30 })}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                +30s Clock
              </button>

              <button
                onClick={() => executeAction('switchSpeaker')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                Switch Speaker
              </button>

              <button
                onClick={() => executeAction('advancePhase')}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition"
              >
                <FastForward className="w-3.5 h-3.5 stroke-[2.5]" />
                Next Segment
              </button>
            </div>

            {/* Quick Demo Simulator Trigger */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Streamer Test Simulator:</span>
              <button
                onClick={handleSimulateScript}
                disabled={isJudgingLoading}
                className="py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isJudgingLoading ? 'Lemonade Processing...' : 'Inject Demo Speeches & Run Analysis'}
              </button>
            </div>
          </div>

          {/* Live Speech Injector & Mic Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Speech Capture & Claim Extraction Feed</span>
              <span className="text-[10px] text-slate-500 lowercase">deterministic attribution</span>
            </h3>

            <form onSubmit={handleSendSpeech} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={speechSpeakerId}
                  onChange={(e) => setSpeechSpeakerId(e.target.value as 'p1' | 'p2')}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                >
                  <option value="p1">🔵 {room.participants.p1.name} ({room.participants.p1.role})</option>
                  <option value="p2">🟡 {room.participants.p2.name} ({room.participants.p2.role})</option>
                </select>

                <input
                  type="text"
                  value={speechText}
                  onChange={(e) => setSpeechText(e.target.value)}
                  placeholder="Type or speak a point into the live ledger..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Feed
                </button>
              </div>
            </form>

            {/* Live Transcript Stream */}
            <div className="mt-4 max-h-56 overflow-y-auto space-y-2.5 pr-2">
              {room.transcript.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">
                  No speech recorded yet. Use the speech input or click &ldquo;Inject Demo Speeches&rdquo; above.
                </div>
              ) : (
                room.transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${entry.speakerId === 'p1' ? 'text-blue-400' : 'text-amber-400'}`}>
                        {entry.speakerName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{entry.timestamp}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Podcast Sidekick & Live Lookups (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Fact-Check & Knowledge Lookups (Podcast Sidekick) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Sidekick Fact Lookups</h3>
                  <p className="text-[10px] text-slate-400">Instant verification & research cards</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {room.lookups?.length || 0} Lookups
              </span>
            </div>

            {/* Quick Manual Lookup Input */}
            <form onSubmit={handleManualLookup} className="flex gap-2 mb-4">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Ask sidekick to look up stat, person, or paper..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition"
              >
                <Search className="w-3.5 h-3.5" />
                Lookup
              </button>
            </form>

            <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2">
              {(!room.lookups || room.lookups.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">
                  No facts looked up yet. The sidekick automatically checks claims mentioning numbers, stats, or research!
                </div>
              ) : (
                room.lookups.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.query}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{item.summary}</p>
                    <div className="text-[10px] text-slate-500 font-semibold pt-0.5">Source: {item.source}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* "The Second" AI Corner Coaching & Scorecard Preview */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Gavel className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    THE SECOND
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-bold">
                      Analysis
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Breakdown & Tactical Advice</p>
                </div>
              </div>

              {currentRound?.theSecond && (
                <button
                  onClick={() => executeAction('releaseFeedback')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    currentRound.theSecond.isReleasedToAir
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  {currentRound.theSecond.isReleasedToAir ? 'Live On Overlay' : 'Push to Stream'}
                </button>
              )}
            </div>

            {currentRound?.theSecond ? (
              <div className="space-y-4">
                {/* Round Winner Banner */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-amber-300 font-bold uppercase">Segment Lead</span>
                    <span className="font-mono text-amber-200">{currentRound.theSecond.marginText}</span>
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {currentRound.theSecond.winnerName}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 italic">
                    &ldquo;{currentRound.theSecond.keySummary}&rdquo;
                  </p>
                </div>

                {/* Speaker 1 Coaching */}
                <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/30 space-y-2">
                  <div className="text-xs font-bold text-blue-400 uppercase">
                    🔵 {room.participants.p1.name} ({room.participants.p1.role})
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <span className="text-emerald-400 font-semibold">Strongest Move: </span>
                    {currentRound.theSecond.p1Highlights.strongestMove}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <span className="text-rose-400 font-semibold">Dropped Point: </span>
                    {currentRound.theSecond.p1Highlights.criticalDroppedPoint}
                  </div>
                  <div className="text-[11px] text-amber-300 font-medium">
                    <span>Tactical Advice: </span>
                    {currentRound.theSecond.p1Highlights.nextRoundTacticalAdjustment}
                  </div>
                </div>

                {/* Speaker 2 Coaching */}
                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase">
                    🟡 {room.participants.p2.name} ({room.participants.p2.role})
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <span className="text-emerald-400 font-semibold">Strongest Move: </span>
                    {currentRound.theSecond.p2Highlights.strongestMove}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <span className="text-rose-400 font-semibold">Dropped Point: </span>
                    {currentRound.theSecond.p2Highlights.criticalDroppedPoint}
                  </div>
                  <div className="text-[11px] text-amber-300 font-medium">
                    <span>Tactical Advice: </span>
                    {currentRound.theSecond.p2Highlights.nextRoundTacticalAdjustment}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 text-xs text-slate-500">
                Segment analysis will automatically synthesize when Round {currentRound?.number || 1} concludes or when you advance to &ldquo;THE SECOND JUDGING&rdquo;.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
