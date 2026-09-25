'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Gavel, 
  Tv, 
  Users, 
  Mic, 
  Activity, 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  Vote,
  Play
} from 'lucide-react';

const SUGGESTIONS = [
  'Resolved: AI code generation will eliminate junior software engineers by 2028.',
  'Resolved: Working remotely produces higher collective velocity than in-office mandates.',
  'Resolved: Open source foundation models provide safer long-term outcomes than closed proprietary models.',
  'Resolved: Nuclear fission is strictly superior to pure renewables for base-load power.',
];

export default function Home() {
  const router = useRouter();
  const [proposition, setProposition] = useState(SUGGESTIONS[0]);
  const [p1Name, setP1Name] = useState('Alex Chen');
  const [p2Name, setP2Name] = useState('Marcus Vance');
  const [formatName, setFormatName] = useState('Standard 3-Round Showdown');
  const [isCreating, setIsCreating] = useState(false);
  const [lemonadeStatus, setLemonadeStatus] = useState<{
    isConnected: boolean;
    model: string;
    latencyMs: number;
    error?: string;
  }>({
    isConnected: false,
    model: 'checking...',
    latencyMs: 0,
  });

  useEffect(() => {
    // Check Lemonade Server connection on load
    fetch('/api/lemonade')
      .then(res => res.json())
      .then(data => {
        setLemonadeStatus({
          isConnected: data.isConnected,
          model: data.model || 'llama-3.3-70b',
          latencyMs: data.latencyMs || 0,
          error: data.error,
        });
      })
      .catch(() => {
        setLemonadeStatus({
          isConnected: false,
          model: 'offline',
          latencyMs: 0,
          error: 'Connection failed',
        });
      });
  }, []);

  const handleCreateRoom = async (simulate: boolean = false) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposition,
          p1Name,
          p2Name,
          formatName,
        }),
      });
      const data = await res.json();
      if (data.success && data.roomId) {
        if (simulate) {
          // Pre-load simulation script
          await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: data.roomId, step: 'loadScript' }),
          });
        }
        router.push(`/room/${data.roomId}/host`);
      }
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-amber-500/20">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
              <Gavel className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-400 bg-clip-text text-transparent">
                  GAVEL
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Debate OS
                </span>
              </div>
              <p className="text-xs text-slate-400">The Live AI-Moderated Debate Harness</p>
            </div>
          </div>

          {/* Lemonade Server Live Status Beacon */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Cpu className="w-4 h-4 text-amber-400" />
            <div className="flex items-center gap-2">
              <span className="text-slate-400">AI Engine:</span>
              <span className="font-semibold text-slate-200">Lemonade Server</span>
            </div>
            <div className="h-3 w-px bg-slate-700 mx-1" />
            {lemonadeStatus.isConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online ({lemonadeStatus.latencyMs}ms)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400/90 font-medium" title="Fallback intelligent evaluator active">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Fallback / Ready (Auto)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Creator Room Form */}
      <section className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Turn-Key Live Stream Show in 60 Seconds
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
            Turn Any Stream Into an{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
              AI-Moderated Debate Show
            </span>
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Deterministic speaker attribution, continuous claim ledgers, synchronized OBS overlays, and the signature 100-point referee scorecards with corner coaching (<em className="text-amber-300 font-medium not-italic">&ldquo;The Second&rdquo;</em>).
          </p>
        </div>

        {/* Room Setup Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6">
            {/* Proposition */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Debate Proposition / Resolution
              </label>
              <input
                type="text"
                value={proposition}
                onChange={(e) => setProposition(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                placeholder="e.g. Resolved: AI code generation will eliminate junior engineers by 2028."
              />
              {/* Presets */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setProposition(s)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition truncate max-w-xs"
                  >
                    Preset {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Debaters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Affirmative Speaker
                  </span>
                </div>
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="bg-slate-950/60 border border-rose-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Negative Speaker
                  </span>
                </div>
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            {/* Format */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">Format:</span>
                <span className="text-xs font-semibold text-slate-200">{formatName}</span>
              </div>
              <span className="text-xs text-slate-500">60s Speeches • Cross-Exam • 60s Breaks</span>
            </div>

            {/* Launch Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => handleCreateRoom(false)}
                disabled={isCreating}
                className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950 stroke-none" />
                {isCreating ? 'Creating Room...' : 'Launch Live Debate Room'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleCreateRoom(true)}
                disabled={isCreating}
                className="w-full sm:w-auto py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4 text-amber-400" />
                Try Interactive Demo Script
              </button>
            </div>
          </div>
        </div>

        {/* The 4 Connected Surfaces */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <Gavel className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Host Control Room</h3>
            <p className="text-xs text-slate-400">Stage director, round clocks, live claim ledger, score release gate, and emergency controls.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <Mic className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Debater Stage</h3>
            <p className="text-xs text-slate-400">Frictionless guest links, mic level checks, teleprompter timers, and corner coaching.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Tv className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">OBS Broadcast Overlay</h3>
            <p className="text-xs text-slate-400">Transparent 1080p browser-source URL with lower thirds, animated scorecards, and victory cards.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Vote className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Audience Companion</h3>
            <p className="text-xs text-slate-400">Live mobile voting generating the signature &ldquo;Audience vs. AI Gavel&rdquo; broadcast comparison.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        <p>Gavel Debate Operating System • Powered by Lemonade Server local LLM architecture</p>
      </footer>
    </main>
  );
}
