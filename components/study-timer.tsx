"use client";

import { useState, useEffect } from "react";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";

export function StudyTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const savedTime = localStorage.getItem("study_time_seconds");
    if (savedTime) setSeconds(parseInt(savedTime, 10));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          localStorage.setItem("study_time_seconds", next.toString());
          return next;
        });
      }, 1000);
    } else if (!isActive && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1 rounded-xl bg-background border border-border text-xs font-mono font-bold text-foreground shadow-sm shrink-0">
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
        <span className="text-[11px] sm:text-xs">{formatTime(seconds)}</span>
      </div>

      <div className="flex items-center gap-1 pl-1 border-l border-border/60">
        <button
          onClick={() => setIsActive(!isActive)}
          className="p-1 hover:text-primary transition-colors"
          title={isActive ? "Pause Study Timer" : "Start Study Timer"}
        >
          {isActive ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          onClick={() => {
            setIsActive(false);
            setSeconds(0);
            localStorage.setItem("study_time_seconds", "0");
          }}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
