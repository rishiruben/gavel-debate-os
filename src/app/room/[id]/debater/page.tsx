'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { DebateState } from '@/types/debate';
import { Gavel, Mic, MicOff, Volume2, ShieldCheck, Clock, Send, Sparkles } from 'lucide-react';

export default function DebaterStage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || 'p1';

  const [room, setRoom] = useState<DebateState | null>(null);
  const [debaterId, setDebaterId] = useState<'p1' | 'p2'>(token === 'p2' ? 'p2' : 'p1');
  const [isMicOn, setIsMicOn] = useState(false);
  const [speechInput, setSpeechInput] = useState('');
  const [micLevel, setMicLevel] = useState(25);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Poll room state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
        }
      } catch (e) {
        console.error('Error fetching debater state:', e);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [roomId]);

  // Mic simulation visualizer
  useEffect(() => {
    if (!isMicOn) {
      setMicLevel(0);
      return;
    }
    const interval = setInterval(() => {
      setMicLevel(Math.floor(20 + Math.random() * 65));
    }, 120);
    return () => clearInterval(interval);
  }, [isMicOn]);

  // Web Speech Recognition for live microphone speech-to-text
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsMicOn(!isMicOn);
      return;
    }

    if (isRecognizing) {
      recognitionRef.current?.stop();
      setIsRecognizing(false);
      setIsMicOn(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecognizing(true);
        setIsMicOn(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setSpeechInput(transcript);
      };

      recognition.onerror = () => {
        setIsRecognizing(false);
      };

      recognition.onend = () => {
        setIsRecognizing(false);
        setIsMicOn(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      setIsMicOn(!isMicOn);
    }
  };

  const handleSendSpeech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speechInput.trim()) return;

    await fetch(`/api/rooms/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addSpeech',
        payload: {
          speakerId: debaterId,
          text: speechInput.trim(),
        },
      }),
    });
    setSpeechInput('');
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-sm font-semibold">Connecting to Green Room...</span>
        </div>
      </div>
    );
  }

  const currentRound = room.rounds[room.currentRoundIndex];
  const isMyTurn = currentRound?.activeSpeakerId === debaterId;
  const me = debaterId === 'p1' ? room.participants.p1 : room.participants.p2;
  const opponent = debaterId === 'p1' ? room.participants.p2 : room.participants.p1;
  const theSecond = currentRound?.theSecond;
  const myHighlights = debaterId === 'p1' ? theSecond?.p1Highlights : theSecond?.p2Highlights;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
            <Gavel className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">GAVEL STAGE</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                debaterId === 'p1' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {me.role || (debaterId === 'p1' ? 'Speaker 1' : 'Speaker 2')}
              </span>
            </div>
            <span className="text-xs text-slate-400">{me.name}</span>
          </div>
        </div>

        {/* Debater Selector Switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDebaterId('p1')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              debaterId === 'p1' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {room.participants.p1.name} ({room.participants.p1.role || 'P1'})
          </button>
          <button
            onClick={() => setDebaterId('p2')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              debaterId === 'p2' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {room.participants.p2.name} ({room.participants.p2.role || 'P2'})
          </button>
        </div>
      </header>

      {/* Main Teleprompter Body */}
      <main className="max-w-4xl mx-auto px-6 py-8 w-full space-y-6 flex-1 flex flex-col justify-center">
        {/* Proposition Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1">
            Debate Resolution
          </span>
          <h1 className="text-lg sm:text-xl font-extrabold text-white">
            {room.proposition}
          </h1>
        </div>

        {/* Huge Teleprompter Status & Clock */}
        <div className={`rounded-3xl p-8 border-2 transition-all duration-300 text-center relative overflow-hidden shadow-2xl ${
          isMyTurn
            ? 'bg-gradient-to-b from-blue-950/80 to-slate-950 border-blue-500 shadow-blue-500/20'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          {isMyTurn && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider animate-pulse">
              <Mic className="w-3.5 h-3.5" />
              You Are Live Speaking
            </div>
          )}

          {!isMyTurn && (
            <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Opponent Speaking: {opponent.name}
            </div>
          )}

          <div className="my-6">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
              Round {currentRound?.number || 1} Speaking Clock
            </span>
            <div className={`font-mono text-7xl sm:text-8xl font-black tracking-tight ${
              isMyTurn ? 'text-amber-400' : 'text-slate-500'
            }`}>
              {Math.floor((currentRound?.timeRemainingSeconds || 0) / 60)
                .toString()
                .padStart(2, '0')}
              :
              {((currentRound?.timeRemainingSeconds || 0) % 60)
                .toString()
                .padStart(2, '0')}
            </div>
          </div>

          {/* Audio Input & Mic Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-800/80">
            <button
              onClick={toggleSpeechRecognition}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                isMicOn
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isMicOn ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4" />}
              {isMicOn ? (isRecognizing ? 'Listening (Live Mic Active)' : 'Mic Level Active') : 'Turn On Live Mic'}
            </button>

            {/* Mic Meter Bar */}
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <div className="w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-100"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">{micLevel}%</span>
            </div>
          </div>
        </div>

        {/* Live Speech Submission */}
        <form onSubmit={handleSendSpeech} className="flex gap-2">
          <input
            type="text"
            value={speechInput}
            onChange={(e) => setSpeechInput(e.target.value)}
            placeholder={isMyTurn ? "Speak or type your argument here..." : "Listening to opponent..."}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>

        {/* Corner Coaching ("The Second") Box */}
        {theSecond && myHighlights && (
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Your Corner Advice (&ldquo;The Second&rdquo;)
              </h3>
            </div>
            <div className="text-xs text-slate-300">
              <span className="text-emerald-400 font-bold block">⚡ Your Strongest Move:</span>
              {myHighlights.strongestMove}
            </div>
            <div className="text-xs text-slate-300">
              <span className="text-rose-400 font-bold block">⚠️ Dropped Opponent Point:</span>
              {myHighlights.criticalDroppedPoint}
            </div>
            <div className="text-xs text-amber-300 font-medium pt-1 border-t border-slate-800">
              <span className="font-bold block">🥊 Tactical Adjustment for Next Round:</span>
              {myHighlights.nextRoundTacticalAdjustment}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-3 text-center text-[11px] text-slate-600">
        Gavel Stage • Connected to Room {roomId}
      </footer>
    </div>
  );
}
