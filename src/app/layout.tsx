import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GAVEL — The AI-Moderated Debate Operating System',
  description: 'Self-serve debate operating system for streamers with real-time argument tracking, OBS overlays, and AI referee scoring powered by Lemonade Server.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
