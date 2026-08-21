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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-foreground transition-colors">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black flex items-center justify-center gap-2 text-foreground">
          <LayoutDashboard className="h-8 w-8 text-primary" /> Learning
          Workspace
        </h1>
        <p className="text-sm text-muted">
          Manage your topics, interact with Gemini AI, take quizzes, and track
          study progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[calc(100vh-250px)] min-h-[420px] max-h-[600px] border-border bg-card shadow-sm flex flex-col transition-colors">
            <CardHeader className="px-5 py-3 border-b border-border shrink-0">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>Gemini AI Workspace</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                  Live Session
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <AIChat />
            </CardContent>
          </Card>

          <QuizModule />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm transition-colors">
            <CardHeader className="px-5 py-3.5 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground">
                Roadmap Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <ModuleList
                topicId={activeTopicId}
                isParentLoading={loadingTopic}
              />
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm transition-colors">
            <CardHeader className="px-5 py-3.5 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground">
                Workspace Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <TodoList />
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm transition-colors">
            <CardHeader className="px-5 py-3.5 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground">
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <DocumentManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
