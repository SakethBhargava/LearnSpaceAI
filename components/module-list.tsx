"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

// 1. Add Props Interface
interface ModuleListProps {
  topicId?: string | null;
  isParentLoading?: boolean;
}

interface Module {
  id: string;
  title: string;
  is_completed: boolean;
}

// 2. Accept props in component definition
export function ModuleList({ topicId, isParentLoading }: ModuleListProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [topicTitle, setTopicTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardModules() {
      if (isParentLoading) return;
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Query active topic
      const { data: activeTopic } = topicId
        ? await supabase
            .from("user_topics")
            .select("id, title")
            .eq("id", topicId)
            .maybeSingle()
        : await supabase
            .from("user_topics")
            .select("id, title")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

      if (activeTopic) {
        setTopicTitle(activeTopic.title);

        const { data: dbModules } = await supabase
          .from("topic_modules")
          .select("id, title, is_completed")
          .eq("topic_id", activeTopic.id)
          .order("order_index", { ascending: true });

        if (dbModules) setModules(dbModules);
      }
      setLoading(false);
    }

    fetchDashboardModules();
  }, [topicId, isParentLoading]);

  if (loading || isParentLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Loading active modules...</span>
      </div>
    );
  }

  if (!topicTitle || modules.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        No active modules found. Go to Learning Path to create a roadmap.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-primary uppercase tracking-wider">
        Topic: {topicTitle}
      </div>
      <div className="space-y-2">
        {modules.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background border border-border text-xs"
          >
            {m.is_completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span
              className={`truncate font-medium ${
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
