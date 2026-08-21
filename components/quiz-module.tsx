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
  ListOrdered,
  Award,
} from "lucide-react";

interface Question {
  question: string;
  options: string[];
  answer: number;
}

export function QuizModule() {
  const [topic, setTopic] = useState<string | null>(null);
  const [proficiency, setProficiency] = useState<string>("Beginner");
  const [fetchingTopic, setFetchingTopic] = useState<boolean>(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number;
  }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Question Count Selector (10 to 20)
  const [questionCount, setQuestionCount] = useState<number>(10);

  const supabase = createClient();

  useEffect(() => {
    async function getActiveTopic() {
      setFetchingTopic(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setFetchingTopic(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_topics")
          .select("title, proficiency_level")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Supabase fetch error:", error);
        }

        if (data) {
          if (data.title) setTopic(data.title);
          if (data.proficiency_level) setProficiency(data.proficiency_level);
        }
      } catch (err) {
        console.error("Failed to load active topic:", err);
      } finally {
        setFetchingTopic(false);
      }
    }

    getActiveTopic();
  }, []);

  const generateQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});

    try {
      const prompt = `Generate a ${questionCount}-question multiple choice quiz on topic "${topic}" tailored specifically for a ${proficiency} proficiency level. Return raw JSON array only formatted like: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": 0}] where answer is index of correct option (0-3). Do not include extra text or markdown formatting.`;

      const formData = new FormData();
      formData.append(
        "messages",
        JSON.stringify([{ role: "user", content: prompt }]),
      );

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const text = await response.text();

      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) {
        throw new Error("No valid JSON array found in response");
      }

      const parsedQuestions = JSON.parse(jsonMatch[0]);
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

  const handleSubmitQuiz = async () => {
    let currentScore = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        currentScore += 1;
      }
    });

    setScore(currentScore);
    setSubmitted(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && topic) {
      await supabase.from("quiz_results").insert({
        user_id: user.id,
        topic_title: topic,
        proficiency: proficiency,
        score: currentScore,
        total_questions: questions.length,
      });
    }
  };

  if (fetchingTopic) {
    return (
      <Card className="p-8 text-center border-border bg-card flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">
          Loading active topic...
        </p>
      </Card>
    );
  }

  if (!topic) {
    return (
      <Card className="p-6 text-center border-border bg-card">
        <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">
          No Active Topic Found
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Set a topic under Learning Path to unlock quizzes.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 border-border bg-card space-y-6 w-full max-w-full overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary shrink-0" /> Test Path
            Assessment
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
            <span className="text-muted-foreground">
              Topic: <strong className="text-primary">{topic}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium capitalize">
              <Award className="h-3 w-3" /> {proficiency} Level
            </span>
          </div>
        </div>

        <Button
          size="sm"
          onClick={generateQuiz}
          disabled={loading}
          className="rounded-xl text-xs gap-1.5 shrink-0 w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {questions.length === 0 ? "Generate Test" : "Retake Test"}
        </Button>
      </div>

      {/* Question Count Selector (Responsive Layout Fix) */}
      <div className="bg-muted/40 p-3.5 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0">
          <ListOrdered className="h-4 w-4 text-primary shrink-0" /> Number of
          Questions
        </label>
        <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 sm:max-w-xs min-w-0">
          <input
            type="range"
            min={10}
            max={20}
            step={1}
            value={questionCount}
            disabled={loading || questions.length > 0}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full flex-1 accent-primary cursor-pointer min-w-0"
          />
          <span className="text-xs font-bold text-foreground bg-background border border-border px-2.5 py-1 rounded-md text-center shrink-0 min-w-[55px]">
            {questionCount} Qs
          </span>
        </div>
      </div>

      {/* Questions Render Stream */}
      {questions.length > 0 && (
        <div className="space-y-6 min-w-0">
          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="space-y-3 border-b border-border/60 pb-4 last:border-b-0 min-w-0"
            >
              <p className="text-xs sm:text-sm font-semibold text-foreground break-words">
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
                      className={`p-3 rounded-xl border text-left text-xs transition-colors flex items-center justify-between gap-2 min-w-0 ${optionStyle}`}
                    >
                      <span className="break-words flex-1">{opt}</span>
                      {submitted && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submission and Scoring */}
          {!submitted ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length < questions.length}
              className="w-full rounded-xl py-2.5 text-sm font-semibold"
            >
              Submit Answers ({Object.keys(selectedAnswers).length}/
              {questions.length})
            </Button>
          ) : (
            <div className="p-4 bg-primary/10 rounded-xl text-center border border-primary/20 space-y-1">
              <p className="text-sm font-bold text-primary">
                Final Score: {score} / {questions.length} (
                {Math.round((score / questions.length) * 100)}%)
              </p>
              <p className="text-xs text-muted-foreground">
                Level: {proficiency} • Total Questions: {questionCount}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
