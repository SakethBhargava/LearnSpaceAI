"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle, Loader2, BookOpen } from "lucide-react";

interface ModuleItem {
  id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
}

interface ModuleListProps {
  topicId: string | null;
  isParentLoading: boolean;
}

export function ModuleList({ topicId, isParentLoading }: ModuleListProps) {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [topicTitle, setTopicTitle] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    if (!topicId) return;

    async function loadModules() {
      setLoadingModules(true);

      const { data: topicData } = await supabase
        .from("user_topics")
        .select("title")
        .eq("id", topicId)
        .single();

      if (topicData) {
        setTopicTitle(topicData.title);
      }

      const { data } = await supabase
        .from("topic_modules")
        .select("*")
        .eq("topic_id", topicId)
        .order("order_index", { ascending: true });

      if (data) {
        setModules(data);
      }
      setLoadingModules(false);
    }

    loadModules();
  }, [topicId]);

  const toggleModuleCompletion = async (
    moduleId: string,
    currentStatus: boolean,
  ) => {
    const updatedStatus = !currentStatus;

    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, is_completed: updatedStatus } : m,
      ),
    );

    const updatedModules = modules.map((m) =>
      m.id === moduleId ? { ...m, is_completed: updatedStatus } : m,
    );

    const completedCount = updatedModules.filter((m) => m.is_completed).length;
    const progress = Math.round((completedCount / updatedModules.length) * 100);

    await supabase
      .from("topic_modules")
      .update({
        is_completed: updatedStatus,
        completed_at: updatedStatus ? new Date().toISOString() : null,
      })
      .eq("id", moduleId);

    if (topicId) {
      await supabase
        .from("user_topics")
        .update({ progress_percent: progress })
        .eq("id", topicId);
    }
  };

  if (isParentLoading || loadingModules) {
    return (
      <div className="p-4 text-center space-y-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
        <p className="text-xs text-muted-foreground">Loading modules...</p>
      </div>
    );
  }

  if (!topicId || modules.length === 0) {
    return (
      <div className="p-4 text-center space-y-1 text-muted-foreground">
        <BookOpen className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-70" />
        <p className="text-xs font-semibold text-foreground">
          No Modules Found
        </p>
        <p className="text-[11px]">
          Generate a learning path to populate your roadmap modules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 min-w-0 w-full">
      {topicTitle && (
        <div className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2 truncate">
          Topic: {topicTitle}
        </div>
      )}

      <div className="space-y-2">
        {modules.map((m) => (
          <div
            key={m.id}
            onClick={() => toggleModuleCompletion(m.id, m.is_completed)}
            className={`p-2.5 rounded-xl border border-border bg-background flex items-center gap-2.5 cursor-pointer hover:border-primary/40 transition-all ${
              m.is_completed
                ? "opacity-80 border-emerald-500/30 bg-emerald-500/5"
                : ""
            }`}
          >
            <button type="button" className="shrink-0 focus:outline-none">
              {m.is_completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary shrink-0 transition-colors" />
              )}
            </button>
            <span
              className={`text-xs font-medium truncate ${
                m.is_completed
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {m.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
