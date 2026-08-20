"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, CheckCircle, ArrowRight, Flame } from "lucide-react";

const typewriterWords = [
  "AI Roadmaps & Live Quizzes",
  "Interactive Learning Paths",
  "Smart Study Assistants",
  "Personalized Progress Tracking",
];

export default function LandingPage() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  // Typewriter effect logic
  useEffect(() => {
    if (subIndex === typewriterWords[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 1800);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % typewriterWords.length);
      return;
    }

    const timeout = setTimeout(
      () => setSubIndex((prev) => prev + (reverse ? -1 : 1)),
      reverse ? 35 : 70,
    );

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8 z-10 my-auto">
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold animate-bounce">
          <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI Study Companion
        </div>

        {/* Heading with Spaced Typewriter Effect */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-foreground min-h-[2.4em] sm:min-h-[2.2em]">
          Master Any Skill with <br />
          <span className="inline-block mt-2 sm:mt-3 py-1">
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              {typewriterWords[index].substring(0, subIndex)}
            </span>
            <span className="animate-pulse text-primary font-light ml-0.5">
              |
            </span>
          </span>
        </h1>

        <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
          Generate custom learning paths, track real-time study streaks, upload
          documentation, and test your knowledge with automatic AI-generated
          quizzes.
        </p>

        {/* CTA Button */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="rounded-2xl px-6 gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              Launch Workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Feature Grid with Fixed Accent Color Hover Shadows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          {/* AI Learning Paths Card (Updated with explicit purple glow) */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-2xl hover:shadow-violet-500/25 hover:border-violet-500/50 hover:-translate-y-1.5 transition-all duration-300">
            <Brain className="h-8 w-8 text-violet-500 mb-3" />
            <h3 className="font-bold text-sm mb-1 text-foreground">
              AI Learning Paths
            </h3>
            <p className="text-xs text-muted">
              Generate concise, high-yield module roadmaps for any technical
              topic in seconds.
            </p>
          </div>

          {/* Streak & Calendar Tracker Card */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-2xl hover:shadow-amber-500/25 hover:border-amber-500/50 hover:-translate-y-1.5 transition-all duration-300">
            <Flame className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="font-bold text-sm mb-1 text-foreground">
              Streak & Calendar Tracker
            </h3>
            <p className="text-xs text-muted">
              Commit to custom study days. Watch your streak grow or reset
              automatically on missed days.
            </p>
          </div>

          {/* Dynamic Practice Quizzes Card */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-2xl hover:shadow-emerald-500/25 hover:border-emerald-500/50 hover:-translate-y-1.5 transition-all duration-300">
            <CheckCircle className="h-8 w-8 text-emerald-500 mb-3" />
            <h3 className="font-bold text-sm mb-1 text-foreground">
              Dynamic Practice Quizzes
            </h3>
            <p className="text-xs text-muted">
              Test your active learning topics with automatically structured
              multiple-choice quizzes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
    </div>
  );
}
