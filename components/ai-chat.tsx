"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyTimer } from "@/components/study-timer";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setLoading(true);
    setIsStreaming(false);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok)
        throw new Error(`Server returned status ${response.status}`);
      if (!response.body) throw new Error("No response body returned");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setIsStreaming(true);

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return next;
        });
      }
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Failed to send message. Please check your network or API key.",
        },
      ]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card transition-colors">
      {/* Dynamic Header Bar with Study Timer */}
      <div className="px-4 py-2 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            AI Study Assistant
          </span>
        </div>
        <StudyTimer />
      </div>

      {/* Messages Stream Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
            <Bot className="h-10 w-10 text-primary mb-2 opacity-80" />
            <p className="text-sm font-medium text-foreground">
              Ask Gemini anything about your active topic.
            </p>
            <p className="text-xs text-muted mt-1">
              Get instant clarifications, quizzes, or structured explanations.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                    : "bg-background border border-border text-foreground rounded-tl-none"
                }`}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-2">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-foreground">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 space-y-1 my-1">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 space-y-1 my-1">
                              {children}
                            </ol>
                          ),
                          code: ({ children }) => (
                            <code className="bg-secondary text-foreground px-1.5 py-0.5 rounded text-[11px] font-mono border border-border">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2 text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>
                        {isStreaming ? "Responding..." : "Thinking..."}
                      </span>
                    </span>
                  )
                ) : (
                  m.content
                )}
              </div>

              {m.role === "user" && (
                <div className="p-1.5 rounded-lg bg-background border border-border text-foreground shrink-0 mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 border-t border-border bg-card/50 backdrop-blur transition-colors">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini a question or request a quiz..."
            className="flex-1 bg-background border border-border text-foreground placeholder:text-muted rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading || !input.trim()}
            className="rounded-xl px-4"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
