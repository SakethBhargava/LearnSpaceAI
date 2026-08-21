"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyTimer } from "@/components/study-timer";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  file?: {
    name: string;
    size: string;
    type: string;
  };
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Attachment States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
  const ACCEPTED_TYPES = [
    "image/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ].join(",");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isStreaming]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size exceeds 15MB limit.");
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || loading) return;

    const userMessage = input.trim();
    const currentFile = selectedFile;

    setInput("");
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const userPayload: Message = {
      role: "user",
      content: userMessage,
      file: currentFile
        ? {
            name: currentFile.name,
            size: (currentFile.size / (1024 * 1024)).toFixed(1) + " MB",
            type: currentFile.type,
          }
        : undefined,
    };

    const updatedMessages: Message[] = [...messages, userPayload];
    setMessages(updatedMessages);
    setLoading(true);
    setIsStreaming(false);

    try {
      // Create FormData if sending binary files to API route
      const formData = new FormData();
      formData.append("messages", JSON.stringify(updatedMessages));
      if (currentFile) {
        formData.append("file", currentFile);
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        body: formData, // Accepts FormData with message and file payload
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
      {/* Header Bar with Study Timer */}
      <div className="px-4 py-2 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            AI Study Assistant
          </span>
        </div>
        <StudyTimer />
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
            <Bot className="h-10 w-10 text-primary mb-2 opacity-80" />
            <p className="text-sm font-medium text-foreground">
              Ask Gemini anything about your active topic.
            </p>
            <p className="text-xs text-muted mt-1">
              Get instant clarifications, upload documents, or request quizzes.
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
                {/* File Attachment Chip in User Message */}
                {m.file && (
                  <div className="flex items-center gap-2 mb-2 p-2 rounded bg-black/10 dark:bg-white/10 text-xs">
                    {m.file.type.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate font-medium">{m.file.name}</span>
                    <span className="opacity-75 text-[10px]">
                      ({m.file.size})
                    </span>
                  </div>
                )}

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

      {/* WhatsApp Style Attachment Bar */}
      <div className="p-3 border-t border-border bg-card/50 backdrop-blur transition-colors space-y-2">
        {/* Selected File Chip */}
        {selectedFile && (
          <div className="flex items-center justify-between bg-muted/60 border border-border px-3 py-1.5 rounded-lg text-xs">
            <div className="flex items-center gap-2 truncate">
              {selectedFile.type.startsWith("image/") ? (
                <ImageIcon className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="truncate font-medium text-foreground">
                {selectedFile.name}
              </span>
              <span className="text-muted-foreground text-[10px]">
                ({(selectedFile.size / (1024 * 1024)).toFixed(1)}MB)
              </span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-muted-foreground hover:text-foreground p-0.5"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Size Error Banner */}
        {fileError && (
          <p className="text-xs text-destructive font-medium px-1">
            {fileError}
          </p>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini or attach a file..."
            className="flex-1 bg-background border border-border text-foreground placeholder:text-muted rounded-full px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          />

          {/* Paperclip Button */}
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Send Button */}
          <Button
            type="submit"
            size="sm"
            disabled={loading || (!input.trim() && !selectedFile)}
            className="h-9 w-9 p-0 rounded-full shrink-0"
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
