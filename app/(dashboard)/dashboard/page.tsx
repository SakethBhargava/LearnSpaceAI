"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIChat } from "@/components/ai-chat";
import { TodoList } from "@/components/todo-list";
import { ModuleList } from "@/components/module-list";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchActiveTopic() {
      setLoadingTopic(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("user_topics")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.id) {
          setActiveTopicId(data.id);
        }
      }
      setLoadingTopic(false);
    }

    fetchActiveTopic();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-foreground transition-colors min-w-0 w-full overflow-hidden">
      {/* Page Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center justify-center gap-2 text-foreground tracking-tight">
          <LayoutDashboard className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
          Learning Workspace
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Manage your topics, interact with Gemini AI, take quizzes, and track
          study progress.
        </p>
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Main Left Column (AI Workspace) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col min-w-0 w-full">
          <Card className="h-[520px] border-border bg-card shadow-sm flex flex-col transition-colors overflow-hidden rounded-xl w-full">
            <CardHeader className="px-5 py-3.5 border-b border-border shrink-0 bg-muted/20">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between gap-2">
                <span>Gemini AI Workspace</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium shrink-0 uppercase tracking-wide">
                  Live Session
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden min-w-0">
              <AIChat />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6 flex flex-col min-w-0 w-full">
          {/* Roadmap Modules */}
          <Card className="border-border bg-card shadow-sm transition-colors rounded-xl overflow-hidden w-full">
            <CardHeader className="px-5 py-3.5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold text-foreground">
                Roadmap Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-5 sm:pt-6">
              <ModuleList
                topicId={activeTopicId}
                isParentLoading={loadingTopic}
              />
            </CardContent>
          </Card>

          {/* Workspace Tasks */}
          <Card className="border-border bg-card shadow-sm transition-colors rounded-xl overflow-hidden w-full">
            <CardHeader className="px-5 py-3.5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold text-foreground">
                Workspace Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-5 sm:pt-6">
              <TodoList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
