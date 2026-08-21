"use client";

import { useState, useEffect } from "react";
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
  const [activeTopic, setActiveTopic] = useState<ActiveTopic | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [isChangingPath, setIsChangingPath] = useState(false);

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

  const loadSavedPath = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Fetch current active topic from DB
    const { data: topicData } = await supabase
      .from("user_topics")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (topicData) {
      setActiveTopic(topicData);

      // 2. RETRIEVE MODULES FROM DB FIRST (No AI trigger on page re-visits)
      const { data: moduleData } = await supabase
        .from("topic_modules")
        .select("*")
        .eq("topic_id", topicData.id)
        .order("order_index", { ascending: true });

      if (moduleData && moduleData.length > 0) {
        setModules(moduleData);
      }
    }
    setLoading(false);
  };

  const handleGeneratePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Create new topic row in user_topics
      const { data: newTopic, error: topicError } = await supabase
        .from("user_topics")
        .insert({
          user_id: user.id,
          title: topic.trim(),
          proficiency_level: proficiency,
          progress_percent: 0,
        })
        .select()
        .single();

      if (topicError || !newTopic) throw topicError;
      setActiveTopic(newTopic);

      // 2. Call AI API ONLY when generating a new topic
      const prompt = `Create a concise 4 to 5 module learning path for "${topic}" at "${proficiency}" level. Return ONLY a raw JSON array of strings containing module titles. Example format: ["Module 1: Fundamentals", "Module 2: Advanced Topics"]`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      const rawText = await response.text();
      let moduleTitles: string[] = [];

      try {
        const cleanJson = rawText.replace(/```json|```/g, "").trim();
        moduleTitles = JSON.parse(cleanJson);
      } catch {
        // Fallback title formatting if JSON string extraction is imperfect
        moduleTitles = [
          `Module 1: Fundamentals of ${topic.trim()}`,
          `Module 2: Core Concepts & Practice`,
          `Module 3: Building Practical Projects`,
          `Module 4: Advanced Architecture & Patterns`,
        ];
      }

      // 3. Insert modules into topic_modules table
      const modulesToInsert = moduleTitles.map((title, idx) => ({
        topic_id: newTopic.id,
        title: title,
        order_index: idx,
        is_completed: false,
      }));

      const { data: savedModules } = await supabase
        .from("topic_modules")
        .insert(modulesToInsert)
        .select();

      if (savedModules) setModules(savedModules);

      // Save raw output string to roadmap_cache for safety
      await supabase
        .from("user_topics")
        .update({ roadmap_cache: rawText })
        .eq("id", newTopic.id);

      setIsChangingPath(false);
    } catch (err) {
      console.error("Path generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleCompletion = async (
    moduleId: string,
    currentStatus: boolean,
  ) => {
    const updatedModules = modules.map((m) =>
      m.id === moduleId ? { ...m, is_completed: !currentStatus } : m,
    );
    setModules(updatedModules);

    // Calculate progress percentage
    const completedCount = updatedModules.filter((m) => m.is_completed).length;
    const progress = Math.round((completedCount / updatedModules.length) * 100);

    // Update individual module state
    await supabase
      .from("topic_modules")
      .update({ is_completed: !currentStatus })
      .eq("id", moduleId);

    // Update parent topic progress
    if (activeTopic) {
      await supabase
        .from("user_topics")
        .update({ progress_percent: progress })
        .eq("id", activeTopic.id);

      setActiveTopic({ ...activeTopic, progress_percent: progress });
    }
  };

  const isCompleted = activeTopic?.progress_percent === 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-foreground min-w-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black flex items-center justify-center gap-2">
          <Compass className="h-8 w-8 text-primary" /> Learning Path Generator
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your current learning roadmap or unlock a new path after
          completion.
        </p>
      </div>

      {/* Show Creation Form ONLY if no topic exists OR user clicked to change path */}
      {!activeTopic || isChangingPath ? (
        <Card className="border-border bg-card p-6">
          <form onSubmit={handleGeneratePath} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold mb-2">
                What do you want to learn?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Next.js 14, Java Core, Data Structures..."
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  onClick={() => setIsChangingPath(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full rounded-xl py-2.5"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating
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
        /* Display Active Path Directly From Database */
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
              className="rounded-xl gap-2 text-xs"
            >
              {isCompleted ? (
                <>
                  <RefreshCw className="h-4 w-4" /> Change Learning Path
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Finish 100% to Unlock New Path
                </>
              )}
            </Button>
          </Card>

          {/* Render Stored Database Modules */}
          <div className="space-y-3">
            {modules.map((m, idx) => (
              <Card
                key={m.id}
                className={`border-border bg-card p-4 flex items-center justify-between transition-all ${
                  m.is_completed ? "opacity-80 border-emerald-500/30" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleModuleCompletion(m.id, m.is_completed)}
                  >
                    {m.is_completed ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0 transition-colors" />
                    )}
                  </button>
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase">
                      Module {idx + 1}
                    </span>
                    <h3
                      className={`text-sm font-bold ${
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
        </div>
      )}
    </div>
  );
}
