"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Compass,
  Sparkles,
  Loader2,
  BookOpen,
  Check,
  Lock,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ActiveTopic {
  id: string;
  title: string;
  proficiency_level: string;
  progress_percent: number;
}

export default function LearningPathPage() {
  const [topic, setTopic] = useState("");
  const [proficiency, setProficiency] = useState("Beginner");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<ActiveTopic | null>(null);
  const [isChangingPath, setIsChangingPath] = useState(false);

  const supabase = createClient();

  const levels = [
    {
      id: "Beginner",
      title: "Beginner",
      desc: "Starting from scratch. Need core fundamentals and guided introduction.",
    },
    {
      id: "Intermediate",
      title: "Intermediate",
      desc: "Know the basics. Want to build real projects and expand skills.",
    },
    {
      id: "Advanced",
      title: "Advanced",
      desc: "Deep technical mastery, optimization, and expert architectural patterns.",
    },
  ];

  useEffect(() => {
    async function fetchCurrentTopic() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_topics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveTopic(data);
        fetchRoadmapContent(data.title, data.proficiency_level);
      }
    }
    fetchCurrentTopic();
  }, []);

  const fetchRoadmapContent = async (topicTitle: string, level: string) => {
    setLoading(true);
    try {
      const prompt = `Create a concise, well-structured learning roadmap for "${topicTitle}" at "${level}" level. Keep it short and high-yield. Include maximum 4 to 5 core modules formatted clearly with Markdown titles like "### Module 1: Title", each with 3 brief key bullet points. Do not write lengthy introductory paragraphs or wordy explanations.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resultText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        setRoadmap(resultText);
      }
    } catch (err) {
      console.error("Error fetching roadmap content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setRoadmap(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let createdTopicId: string | null = null;

      if (user) {
        const { data: insertedTopic, error: topicError } = await supabase
          .from("user_topics")
          .insert({
            user_id: user.id,
            title: topic.trim(),
            proficiency_level: proficiency,
            progress_percent: 0,
          })
          .select()
          .single();

        if (topicError) {
          console.error("Error creating user_topic:", topicError);
        } else if (insertedTopic) {
          createdTopicId = insertedTopic.id;
          setActiveTopic(insertedTopic);
        }
      }

      const prompt = `Create a concise, well-structured learning roadmap for "${topic}" at "${proficiency}" level. Keep it short and high-yield. Include maximum 4 to 5 core modules formatted clearly with Markdown titles like "### Module 1: Title", each with 3 brief key bullet points. Do not write lengthy introductory paragraphs or wordy explanations.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      if (!response.body) throw new Error("No response body received from API");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resultText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        setRoadmap(resultText);
      }

      // Parse module titles and insert into topic_modules
      if (createdTopicId) {
        const moduleLines = resultText
          .split("\n")
          .filter((line) => line.trim().toLowerCase().includes("module"))
          .map((line) =>
            line
              .replace(/^#+\s*/, "")
              .replace(/\*+/g, "")
              .trim(),
          );

        const finalModules =
          moduleLines.length > 0
            ? moduleLines
            : [
                `Module 1: Fundamentals of ${topic.trim()}`,
                `Module 2: Core Concepts & Practice`,
                `Module 3: Hands-on Projects`,
                `Module 4: Advanced Topics`,
              ];

        const modulesToInsert = finalModules.slice(0, 5).map((title, idx) => ({
          topic_id: createdTopicId,
          title: title,
          order_index: idx,
          is_completed: false,
        }));

        const { error: modulesError } = await supabase
          .from("topic_modules")
          .insert(modulesToInsert);

        if (modulesError) {
          console.error("Error inserting topic_modules:", modulesError);
        }
      }

      setIsChangingPath(false);
    } catch (err) {
      console.error("Path generation failed:", err);
      setRoadmap("Failed to generate learning path. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = activeTopic?.progress_percent === 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-foreground transition-colors min-w-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black flex items-center justify-center gap-2 text-foreground">
          <Compass className="h-8 w-8 text-primary" /> Learning Path Generator
        </h1>
        <p className="text-sm text-muted">
          Track your current learning roadmap or unlock a new path after
          completion.
        </p>
      </div>

      {!activeTopic || isChangingPath ? (
        <Card className="border-border bg-card shadow-sm p-6 transition-colors min-w-0 overflow-hidden">
          <form onSubmit={handleGeneratePath} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold mb-2 text-foreground">
                What do you want to learn?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Java Core, Next.js 14, Data Structures..."
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-foreground">
                Select Your Proficiency Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {levels.map((lvl) => {
                  const isSelected = proficiency === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setProficiency(lvl.id)}
                      className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border bg-background hover:bg-card/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                        >
                          {lvl.title}
                        </span>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-muted leading-snug">
                        {lvl.desc}
                      </span>
                    </button>
                  );
                })}
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
                    <Sparkles className="h-4 w-4" /> Start New Path
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="border-border bg-card shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Active Learning Path
            </span>
            <h2 className="text-xl font-black text-foreground">
              {activeTopic.title}
            </h2>
            <p className="text-xs text-muted">
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
                <Lock className="h-4 w-4" /> Complete Current Path to Switch
              </>
            )}
          </Button>
        </Card>
      )}

      {roadmap && (
        <Card className="border-border bg-card shadow-sm p-6 transition-colors min-w-0 overflow-hidden">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
            <BookOpen className="h-5 w-5 shrink-0" /> Recommended Modules
          </h2>
          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3 break-words overflow-x-auto">
            <ReactMarkdown>{roadmap}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
