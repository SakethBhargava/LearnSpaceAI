"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart2,
  CheckCircle2,
  BookOpen,
  Clock,
  Flame,
  Calendar,
} from "lucide-react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PerformancePage() {
  const [stats, setStats] = useState({
    tasksCompleted: "0 / 0",
    activeTopics: "0",
    averageMastery: "0%",
    streakStatus: "0 Days",
  });

  // Default weekly study schedule (1 = Mon, 2 = Tue, etc.)
  const [scheduledDays, setScheduledDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const supabase = createClient();

  const toggleDay = (dayIndex: number) => {
    setScheduledDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex],
    );
  };

  useEffect(() => {
    async function fetchPerformanceData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Todos
      const { data: todos } = await supabase
        .from("todos")
        .select("is_completed, updated_at")
        .eq("user_id", user.id);

      const totalTodos = todos?.length || 0;
      const completedTodos = todos?.filter((t) => t.is_completed).length || 0;

      // 2. Fetch Topics
      const { data: topics } = await supabase
        .from("user_topics")
        .select("progress_percent, created_at")
        .eq("user_id", user.id);

      const activeTopicsCount = topics?.length || 0;
      const totalProgress =
        topics?.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) ||
        0;
      const avgMastery =
        activeTopicsCount > 0
          ? Math.round(totalProgress / activeTopicsCount)
          : 0;

      // 3. Compute Streak strictly based on calendar days (Date transitions)
      const activityDates = new Set<string>();

      todos?.forEach((t) => {
        if (t.updated_at)
          activityDates.add(new Date(t.updated_at).toISOString().split("T")[0]);
      });
      topics?.forEach((t) => {
        if (t.created_at)
          activityDates.add(new Date(t.created_at).toISOString().split("T")[0]);
      });

      let currentStreak = 0;
      let checkDate = new Date();
      let todayStr = checkDate.toISOString().split("T")[0];

      // Check if user completed anything today; if not, check from yesterday
      if (!activityDates.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        const dayOfWeek = checkDate.getDay();

        // If this day is scheduled in the weekly plan
        if (scheduledDays.includes(dayOfWeek)) {
          if (activityDates.has(dateStr)) {
            currentStreak++;
          } else {
            // Missed a scheduled study day -> Streak breaks to 0
            break;
          }
        }
        checkDate.setDate(checkDate.getDate() - 1);

        // Safety break limit to prevent infinite loops (e.g. max 365 days back)
        if (currentStreak > 365) break;
      }

      setStats({
        tasksCompleted: `${completedTodos} / ${totalTodos}`,
        activeTopics: `${activeTopicsCount}`,
        averageMastery: `${avgMastery}%`,
        streakStatus:
          currentStreak > 0 ? `${currentStreak} Days 🔥` : "0 Days ❄️",
      });
    }

    fetchPerformanceData();
  }, [scheduledDays]);

  const metrics = [
    {
      title: "Tasks Completed",
      value: stats.tasksCompleted,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      title: "Active Topics",
      value: stats.activeTopics,
      icon: BookOpen,
      color: "text-indigo-500",
    },
    {
      title: "Average Topic Mastery",
      value: stats.averageMastery,
      icon: Clock,
      color: "text-blue-500",
    },
    {
      title: "Streak Status",
      value: stats.streakStatus,
      icon: Flame,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-foreground transition-colors">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black flex items-center justify-center gap-2 text-foreground">
          <BarChart2 className="h-8 w-8 text-primary" /> Performance Analytics
        </h1>
        <p className="text-sm text-muted">
          Real-time metrics computed directly from your daily workspace
          activity.
        </p>
      </div>

      {/* Weekly Plan Selection Bar */}
      <Card className="border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Calendar className="h-4 w-4 text-primary" /> Weekly Study Schedule
        </div>
        <p className="text-xs text-muted">
          Select the days you commit to studying. Missing a planned day will
          reset your streak to zero.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {DAYS_OF_WEEK.map((day, idx) => {
            const isScheduled = scheduledDays.includes(idx);
            return (
              <button
                key={day}
                onClick={() => toggleDay(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isScheduled
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted hover:text-foreground border-border"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Card
              key={idx}
              className="border-border bg-card shadow-sm p-2 transition-colors"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl bg-background border border-border shrink-0 ${m.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground leading-none mb-1">
                    {m.value}
                  </div>
                  <div className="text-xs text-muted font-medium">
                    {m.title}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
