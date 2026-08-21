"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart2,
  CheckCircle2,
  BookOpen,
  Clock,
  Flame,
  GraduationCap,
  Award,
  Sparkles,
} from "lucide-react";

interface QuizResult {
  id: string;
  topic_title: string;
  proficiency: string;
  score: number;
  total_questions: number;
  created_at: string;
}

// Converts any timestamp string or Date object into a normalized local YYYY-MM-DD string with safety check
const toLocalDateString = (dateInput: Date | string | null | undefined) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Gets normalized midnight timestamp in local time for accurate day-difference calculation
const toMidnightMs = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
};

export default function PerformancePage() {
  const [stats, setStats] = useState({
    tasksCompleted: "0 / 0",
    activeTopics: "0",
    averageMastery: "0%",
    streakStatus: "0 Days ❄️",
    testAccuracy: "0%",
    totalTestsTaken: "0",
  });

  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPerformanceData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Todos
      const { data: todos } = await supabase
        .from("todos")
        .select("is_completed, updated_at, created_at")
        .eq("user_id", user.id);

      const totalTodos = todos?.length || 0;
      const completedTodos = todos?.filter((t) => t.is_completed).length || 0;

      // 2. Fetch Topics & Modules
      const { data: topics } = await supabase
        .from("user_topics")
        .select("id, progress_percent, created_at")
        .eq("user_id", user.id);

      const activeTopicsCount = topics?.length || 0;
      const totalProgress =
        topics?.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) ||
        0;
      const avgMastery =
        activeTopicsCount > 0
          ? Math.round(totalProgress / activeTopicsCount)
          : 0;

      const topicIds = topics?.map((t) => t.id) || [];
      let modulesData: { completed_at: string | null }[] = [];
      if (topicIds.length > 0) {
        const { data: modules } = await supabase
          .from("topic_modules")
          .select("completed_at")
          .in("topic_id", topicIds)
          .eq("is_completed", true);
        modulesData = modules || [];
      }

      // 3. Fetch Test / Quiz Results
      const { data: quizzes } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const totalQuizzes = quizzes?.length || 0;
      let totalScoreEarned = 0;
      let totalQuestionsPossible = 0;

      quizzes?.forEach((q) => {
        totalScoreEarned += q.score;
        totalQuestionsPossible += q.total_questions;
      });

      const avgAccuracy =
        totalQuestionsPossible > 0
          ? Math.round((totalScoreEarned / totalQuestionsPossible) * 100)
          : 0;

      setQuizHistory(quizzes || []);

      // 4. Collect All Unique Activity Local Dates (YYYY-MM-DD)
      const activeDatesSet = new Set<string>();

      // Check Completed Todos
      todos?.forEach((t) => {
        if (t.is_completed) {
          const dateStr = toLocalDateString(t.updated_at || t.created_at);
          if (dateStr) activeDatesSet.add(dateStr);
        }
      });

      // Check Completed Modules
      modulesData.forEach((m) => {
        if (m.completed_at) {
          const dateStr = toLocalDateString(m.completed_at);
          if (dateStr) activeDatesSet.add(dateStr);
        }
      });

      // Check Completed Quizzes
      quizzes?.forEach((q) => {
        if (q.created_at) {
          const dateStr = toLocalDateString(q.created_at);
          if (dateStr) activeDatesSet.add(dateStr);
        }
      });

      // 5. Robust Streak Calculation
      const sortedDates = Array.from(activeDatesSet).sort(
        (a, b) => toMidnightMs(b) - toMidnightMs(a),
      );

      let currentStreak = 0;

      if (sortedDates.length > 0) {
        const todayStr = toLocalDateString(new Date())!;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = toLocalDateString(yesterday)!;

        const latestActivityDate = sortedDates[0];

        // Active streak counts if the user completed an activity today or yesterday
        if (
          latestActivityDate === todayStr ||
          latestActivityDate === yesterdayStr
        ) {
          currentStreak = 1;

          for (let i = 0; i < sortedDates.length - 1; i++) {
            const currentMs = toMidnightMs(sortedDates[i]);
            const previousMs = toMidnightMs(sortedDates[i + 1]);

            // Calculate exact calendar day difference
            const diffInDays = Math.round(
              (currentMs - previousMs) / (1000 * 3600 * 24),
            );

            if (diffInDays === 1) {
              currentStreak++;
            } else if (diffInDays > 1) {
              break;
            }
          }
        } else {
          currentStreak = 0;
        }
      }

      setStats({
        tasksCompleted: `${completedTodos} / ${totalTodos}`,
        activeTopics: `${activeTopicsCount}`,
        averageMastery: `${avgMastery}%`,
        streakStatus:
          currentStreak > 0 ? `${currentStreak} Days 🔥` : "0 Days ❄️",
        testAccuracy: `${avgAccuracy}%`,
        totalTestsTaken: `${totalQuizzes}`,
      });
    }

    fetchPerformanceData();
  }, []);

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
    {
      title: "Test Accuracy",
      value: stats.testAccuracy,
      icon: GraduationCap,
      color: "text-purple-500",
    },
    {
      title: "Tests Completed",
      value: stats.totalTestsTaken,
      icon: Sparkles,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-foreground transition-colors">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black flex items-center justify-center gap-2 text-foreground">
          <BarChart2 className="h-8 w-8 text-primary" /> Performance Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time metrics computed directly from your daily workspace activity
          and test evaluations.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Card
              key={idx}
              className="border-border bg-card shadow-sm transition-colors"
            >
              <CardContent className="pt-6 pb-5 px-5 flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl bg-background border border-border shrink-0 ${m.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground leading-none mb-1">
                    {m.value}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {m.title}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assessment History Table */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="px-5 py-4 border-b border-border">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Assessment History & Test
            Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {quizHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No test attempts recorded yet. Complete a quiz on your Dashboard to populate your analytics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border font-semibold">
                  <tr>
                    <th className="p-3.5 pl-5">Topic</th>
                    <th className="p-3.5">Proficiency</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Accuracy</th>
                    <th className="p-3.5 pr-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {quizHistory.map((q) => {
                    const percent = Math.round(
                      (q.score / q.total_questions) * 100,
                    );
                    return (
                      <tr
                        key={q.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3.5 pl-5 font-semibold text-foreground">
                          {q.topic_title}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium capitalize">
                            {q.proficiency}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">
                          {q.score} / {q.total_questions}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`font-bold ${
                              percent >= 70
                                ? "text-emerald-500"
                                : percent >= 40
                                  ? "text-amber-500"
                                  : "text-destructive"
                            }`}
                          >
                            {percent}%
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-muted-foreground">
                          {new Date(q.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}