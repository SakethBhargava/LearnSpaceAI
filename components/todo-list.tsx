"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle, Trash2, Loader2 } from "lucide-react";

interface Todo {
  id: string;
  title: string;
  is_completed: boolean;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadTodos() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("todos")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data) setTodos(data);
      }
      setLoading(false);
    }

    loadTodos();
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const newTodoTitle = input.trim();
    setInput("");

    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: user.id,
        title: newTodoTitle,
        is_completed: false,
      })
      .select()
      .single();

    if (data && !error) {
      setTodos((prev) => [data, ...prev]);
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_completed: !currentStatus } : t,
      ),
    );

    await supabase
      .from("todos")
      .update({ is_completed: !currentStatus })
      .eq("id", id);
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("todos").delete().eq("id", id);
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Input Form with Flex Constraint Fix */}
      <form
        onSubmit={addTodo}
        className="flex items-center gap-2 w-full min-w-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 min-w-0 bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim()}
          className="h-9 w-9 rounded-xl shrink-0"
          title="Add Task"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Todo List Items Stream */}
      {loading ? (
        <div className="p-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
        </div>
      ) : todos.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-4">
          No active tasks found.
        </p>
      ) : (
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`p-2.5 rounded-xl border border-border bg-background flex items-center justify-between gap-2.5 transition-all ${
                todo.is_completed ? "opacity-60 bg-muted/30" : ""
              }`}
            >
              <div
                onClick={() => toggleTodo(todo.id, todo.is_completed)}
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
              >
                <button type="button" className="shrink-0 focus:outline-none">
                  {todo.is_completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground hover:text-primary shrink-0 transition-colors" />
                  )}
                </button>
                <span
                  className={`text-xs font-medium truncate ${
                    todo.is_completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {todo.title}
                </span>
              </div>

              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0"
                title="Delete Task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
