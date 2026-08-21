"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, CheckSquare, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TodoList() {
  const [todos, setTodos] = useState<any[]>([]);
  const [taskText, setTaskText] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchTodos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setTodos(data);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from("todos").insert({
        task: taskText.trim(),
        user_id: user.id,
      });

      if (!error) {
        setTaskText("");
        fetchTodos();
      } else {
        alert(error.message);
      }
    }
    setLoading(false);
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: nextStatus } : t)),
    );

    const { error } = await supabase
      .from("todos")
      .update({
        is_completed: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to toggle todo status:", error);
      fetchTodos();
    }
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("todos").delete().eq("id", id);
    fetchTodos();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddTodo} className="flex gap-2">
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading}
          className="rounded-xl px-3"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </form>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {todos.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">
            No active tasks found.
          </p>
        ) : (
          todos.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border text-xs"
            >
              <button
                onClick={() => toggleTodo(t.id, t.is_completed)}
                className="flex items-center gap-2 text-left"
              >
                {t.is_completed ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={
                    t.is_completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground font-medium"
                  }
                >
                  {t.task}
                </span>
              </button>
              <button
                onClick={() => deleteTodo(t.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
