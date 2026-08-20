"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface Question {
  question: string;
  options: string[];
  answer: number;
}

export function QuizModule() {
  const [topic, setTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number;
  }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    async function getActiveTopic() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_topics")
        .select("title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.title) setTopic(data.title);
    }
    getActiveTopic();
  }, []);

  const generateQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});

    try {
      const prompt = `Generate a 3-question multiple choice quiz on topic "${topic}". Return raw JSON array only formatted like: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": 0}] where answer is index of correct option (0-3).`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      const text = await response.text();
      const cleanedJson = text.substring(
        text.indexOf("["),
        text.lastIndexOf("]") + 1,
      );
      const parsedQuestions = JSON.parse(cleanedJson);
      setQuestions(parsedQuestions);
    } catch (e) {
      console.error("Quiz parsing error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmitQuiz = () => {
    let currentScore = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        currentScore += 1;
      }
    });
    setScore(currentScore);
    setSubmitted(true);
  };

  if (!topic) {
    return (
      <Card className="p-6 text-center border-border bg-card">
        <HelpCircle className="h-8 w-8 text-muted mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">
          No Active Topic Found
        </p>
        <p className="text-xs text-muted mt-1">
          Set a topic under Learning Path to unlock quizzes.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border bg-card space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Active Topic Quiz
          </h3>
          <p className="text-xs text-muted">
            Topic: <span className="font-semibold text-primary">{topic}</span>
          </p>
        </div>
        <Button
          size="sm"
          onClick={generateQuiz}
          disabled={loading}
          variant="outline"
          className="rounded-xl text-xs"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {questions.length === 0 ? " Start Quiz" : " Retake"}
        </Button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="space-y-2 border-b border-border/50 pb-3"
            >
              <p className="text-xs font-semibold text-foreground">
                {qIdx + 1}. {q.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[qIdx] === oIdx;
                  const isCorrect = q.answer === oIdx;

                  let optionStyle =
                    "bg-background border-border text-foreground hover:border-primary/50";
                  if (submitted) {
                    if (isCorrect)
                      optionStyle =
                        "bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold";
                    else if (isSelected && !isCorrect)
                      optionStyle =
                        "bg-destructive/10 border-destructive text-destructive font-bold";
                  } else if (isSelected) {
                    optionStyle =
                      "bg-primary/10 border-primary text-primary font-bold";
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && isCorrect && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!submitted ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length < questions.length}
              className="w-full rounded-xl"
            >
              Submit Answers
            </Button>
          ) : (
            <div className="p-3 bg-primary/10 rounded-xl text-center border border-primary/20">
              <p className="text-xs font-bold text-primary">
                Score: {score} / {questions.length} (
                {Math.round((score / questions.length) * 100)}%)
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
