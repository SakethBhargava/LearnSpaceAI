"use client";

import { QuizModule } from "@/components/quiz-module";
import { Sparkles, GraduationCap } from "lucide-react";

export default function QuizPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-foreground">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black flex items-center justify-center gap-2 text-foreground">
          <GraduationCap className="h-8 w-8 text-primary" /> Tests & Assesments
        </h1>
        <p className="text-sm text-muted-foreground">
          Evaluate your understanding of your active topic through AI-generated
          tests.
        </p>
      </div>

      {/* Main Quiz Module Container */}
      <div className="space-y-6">
        <QuizModule />
      </div>
    </div>
  );
}
