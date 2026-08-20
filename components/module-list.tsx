"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle, Layers, Loader2 } from "lucide-react";

interface Module {
  id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
}

export function ModuleList({
  topicId,
  isParentLoading = false,
}: {
  topicId: string | null;
  isParentLoading?: boolean;
}) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchModules() {
      if (!topicId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("topic_modules")
        .select("*")
        .eq("topic_id", topicId)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching topic modules:", error);
      } else if (data) {
        setModules(data);
      }
      setLoading(false);
    }

    if (!isParentLoading) {
      fetchModules();
    }
  }, [topicId, isParentLoading]);

  const toggleModule = async (moduleId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, is_completed: nextStatus } : m,
      ),
    );

    await supabase
      .from("topic_modules")
      .update({ is_completed: nextStatus })
      .eq("id", moduleId);
  };

  if (isParentLoading || loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading
        modules...
      </div>
    );
  }

  if (!topicId || modules.length === 0) {
    return (
      <div className="p-4 text-center border border-dashed border-border rounded-xl space-y-1">
        <Layers className="h-5 w-5 text-muted mx-auto mb-1" />
        <p className="text-xs font-semibold text-foreground">
          No Modules Found
        </p>
        <p className="text-[11px] text-muted">
          Generate a roadmap in <strong>Learning Path</strong> to view modules
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {modules.map((mod) => (
        <button
          key={mod.id}
          onClick={() => toggleModule(mod.id, mod.is_completed)}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left"
        >
          <span
            className={`text-xs font-medium ${
              mod.is_completed ? "line-through text-muted" : "text-foreground"
            }`}
          >
            {mod.order_index + 1}. {mod.title}
          </span>
          {mod.is_completed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Circle className="h-4 w-4 text-muted shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}
