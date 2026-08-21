"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIChat } from "@/components/ai-chat";
import { TodoList } from "@/components/todo-list";
import { DocumentManager } from "@/components/document-manager";
import { QuizModule } from "@/components/quiz-module";
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
        // Retrieve the latest active topic created by the user
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-foreground transition-colors min-w-0">
      {/* Page Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center justify-center gap-2.5 text-foreground tracking-tight">
          <LayoutDashboard className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
          Learning Workspace
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Manage your topics, interact with Gemini AI, take quizzes, and track
          study progress.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Column (Primary Tools) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          {/* AI Chat Card */}
          <Card className="h-[520px] border-border bg-card shadow-sm flex flex-col overflow-hidden transition-all rounded-xl">
            <CardHeader className="px-5 py-3.5 border-b border-border shrink-0 bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                <span>Gemini AI Workspace</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold tracking-wide uppercase">
                  Live Session
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              <AIChat />
            </CardContent>
          </Card>

          {/* Quiz Module */}
          <Card className="border-border bg-card shadow-sm transition-all rounded-xl overflow-hidden">
            <QuizModule />
          </Card>
        </div>

        {/* Right Sidebar (Tracking & Resources) */}
        <div className="space-y-6 flex flex-col justify-start">
          {/* Roadmap Modules */}
          <Card className="border-border bg-card shadow-sm transition-all rounded-xl overflow-hidden">
            <CardHeader className="px-5 py-3.5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground">
                Roadmap Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <ModuleList
                topicId={activeTopicId}
                isParentLoading={loadingTopic}
              />
            </CardContent>
          </Card>

          {/* Workspace Tasks */}
          <Card className="border-border bg-card shadow-sm transition-all rounded-xl overflow-hidden">
            <CardHeader className="px-5 py-3.5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground">
                Workspace Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <TodoList />
            </CardContent>
          </Card>

          {/* Resources & Documents */}
          <Card className="border-border bg-card shadow-sm transition-all rounded-xl overflow-hidden">
            <CardHeader className="px-5 py-3.5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground">
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <DocumentManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
