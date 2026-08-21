"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Compass,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  Lock,
  RefreshCw,
  LayoutDashboard,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

interface ActiveTopic {
  id: string;
  title: string;
  proficiency_level: string;
  progress_percent: number;
  roadmap_cache?: string | null;
}

interface ModuleItem {
  id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
}

export default function LearningPathPage() {
  const [topic, setTopic] = useState("");
  const [proficiency, setProficiency] = useState("Beginner");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<ActiveTopic | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [isChangingPath, setIsChangingPath] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const supabase = createClient();

  const levels = [
    {
      id: "Beginner",
      title: "Beginner",
      desc: "Core fundamentals and guided introduction.",
    },
    {
      id: "Intermediate",
      title: "Intermediate",
      desc: "Real projects and expanding skills.",
    },
    {
      id: "Advanced",
      title: "Advanced",
      desc: "Deep technical mastery and architectural patterns.",
    },
  ];

  useEffect(() => {
    loadSavedPath();
  }, []);

  // Retrieves stored learning path directly from Supabase
  const loadSavedPath = async () => {
    setInitialLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setInitialLoading(false);
        return;
      }

      // 1. Fetch user's latest active topic
      const { data: topicData } = await supabase
        .from("user_topics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (topicData) {
        setActiveTopic(topicData);

        // 2. Fetch saved modules associated with this topic
        const { data: moduleData } = await supabase
          .from("topic_modules")
          .select("*")
          .eq("topic_id", topicData.id)
          .order("order_index", { ascending: true });

        if (moduleData && moduleData.length > 0) {
          setModules(moduleData);
        }
      }
    } catch (err) {
      console.error("Failed to load saved path:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleGeneratePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setApiError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to generate a path.");
      }

      // 1. Prompt Gemini for structured module titles
      const prompt = `Generate a realistic 4 to 6 module learning roadmap for mastering "${topic.trim()}" at "${proficiency}" proficiency level.
Return ONLY a valid JSON array of strings containing module titles.
Format example:
["Module 1: Getting Started & Foundations", "Module 2: Core Concepts & Deep Dive", "Module 3: Hands-on Projects", "Module 4: Advanced Patterns & Best Practices"]
Do not wrap in markdown or add explanatory text outside the array.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errMsg = `API error (${response.status}): ${response.statusText}`;
        try {
          const parsed = JSON.parse(responseText);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (responseText.trim()) errMsg = responseText;
        }
        throw new Error(errMsg);
      }

      // 2. Parse AI JSON array
      let moduleTitles: string[] = [];
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            moduleTitles = parsed.map((item) =>
              typeof item === "string"
                ? item
                : item.title || JSON.stringify(item),
            );
          }
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
        }
      }

      if (moduleTitles.length === 0) {
        throw new Error(
          "AI response could not be parsed into modules. Please try generating again.",
        );
      }

      // 3. Insert topic into user_topics table
      const { data: newTopic, error: topicError } = await supabase
        .from("user_topics")
        .insert({
          user_id: user.id,
          title: topic.trim(),
          proficiency_level: proficiency,
          progress_percent: 0,
          roadmap_cache: responseText,
        })
        .select()
        .single();

      if (topicError || !newTopic) {
        throw new Error(topicError?.message || "Failed to create new topic.");
      }

      // 4. Insert generated modules into topic_modules table
      const modulesToInsert = moduleTitles.map((title, idx) => ({
        topic_id: newTopic.id,
        title: title,
        order_index: idx,
        is_completed: false,
      }));

      const { data: savedModules, error: moduleError } = await supabase
        .from("topic_modules")
        .insert(modulesToInsert)
        .select();

      if (moduleError || !savedModules) {
        throw new Error(
          moduleError?.message || "Failed to save generated modules.",
        );
      }

      // 5. Update local state
      setActiveTopic(newTopic);
      setModules(savedModules);
      setIsChangingPath(false);
      setTopic("");
    } catch (err: any) {
      console.error("Path generation failed:", err);
      setApiError(err.message || "Failed to generate learning path.");
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleCompletion = async (
    moduleId: string,
    currentStatus: boolean,
  ) => {
    const nextStatus = !currentStatus;
    const updatedModules = modules.map((m) =>
      m.id === moduleId ? { ...m, is_completed: nextStatus } : m,
    );
    setModules(updatedModules);

    const completedCount = updatedModules.filter((m) => m.is_completed).length;
    const progress = Math.round((completedCount / updatedModules.length) * 100);

    await supabase
      .from("topic_modules")
      .update({
        is_completed: nextStatus,
        completed_at: nextStatus ? new Date().toISOString() : null,
      })
      .eq("id", moduleId);

    if (activeTopic) {
      await supabase
        .from("user_topics")
        .update({ progress_percent: progress })
        .eq("id", activeTopic.id);

      setActiveTopic({ ...activeTopic, progress_percent: progress });
    }
  };

  const isCompleted = activeTopic?.progress_percent === 100;

  if (initialLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center space-y-3 min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading learning workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-foreground min-w-0">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black flex items-center justify-center gap-2">
          <Compass className="h-8 w-8 text-primary" /> Learning Path Generator
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your current learning roadmap or unlock a new path after
          completion.
        </p>
      </div>

      {/* Creation Form */}
      {!activeTopic || isChangingPath ? (
        <Card className="border-border bg-card p-6 space-y-6">
          {apiError && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1.5 flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Failed to generate path</p>
                <p className="leading-relaxed opacity-90">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleGeneratePath} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold mb-2">
                What do you want to learn?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Python for Data Science, Next.js 15, System Design..."
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Select Your Proficiency Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {levels.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setProficiency(lvl.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      proficiency === lvl.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-background hover:bg-card/50"
                    }`}
                  >
                    <span className="text-sm font-bold">{lvl.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {lvl.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {activeTopic && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPath(false);
                    setApiError(null);
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full rounded-xl py-2.5 font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating AI
                    Roadmap...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Start New Learning Path
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* Display Stored Path from Supabase */
        <div className="space-y-6">
          <Card className="border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Active Learning Path
              </span>
              <h2 className="text-2xl font-black">{activeTopic.title}</h2>
              <p className="text-xs text-muted-foreground">
                Level: {activeTopic.proficiency_level} | Progress:{" "}
                {activeTopic.progress_percent}%
              </p>
            </div>

            <Button
              disabled={!isCompleted}
              onClick={() => setIsChangingPath(true)}
              variant={isCompleted ? "default" : "outline"}
              className={`rounded-xl gap-2 text-xs font-semibold ${
                !isCompleted
                  ? "border-border bg-muted/50 text-foreground opacity-100 dark:bg-muted/30"
                  : ""
              }`}
            >
              {isCompleted ? (
                <>
                  <RefreshCw className="h-4 w-4" /> Change Learning Path
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-primary" /> Finish 100% to
                  Unlock New Path
                </>
              )}
            </Button>
          </Card>

          {/* Module List */}
          <div className="space-y-3">
            {modules.map((m, idx) => (
              <Card
                key={m.id}
                className={`border-border bg-card p-4 flex items-center justify-between transition-all ${
                  m.is_completed
                    ? "opacity-80 border-emerald-500/30 bg-emerald-500/5"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleModuleCompletion(m.id, m.is_completed)}
                    className="shrink-0"
                  >
                    {m.is_completed ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-primary uppercase">
                      Module {idx + 1}
                    </span>
                    <h3
                      className={`text-sm font-bold truncate ${
                        m.is_completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {m.title}
                    </h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Navigation link back to Dashboard */}
          <Card className="border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold flex items-center justify-center sm:justify-start gap-2 text-foreground">
                <LayoutDashboard className="h-5 w-5 text-primary" /> Ready to
                Study & Complete Modules?
              </h3>
              <p className="text-xs text-muted-foreground max-w-lg">
                Head over to your Workspace Dashboard to interact with the AI
                tutor, solve quizzes, and complete tasks.
              </p>
            </div>
            <Link href="/dashboard" className="shrink-0 w-full sm:w-auto">
              <Button className="w-full sm:w-auto rounded-xl gap-2 font-semibold">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
