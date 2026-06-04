import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User as UserIcon, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { getStreamToken } from "../api/ai.api";
import { useAIStream } from "../hooks/useAIStream";
import type { SourceChunk } from "../api/ai.api";
import { parseMarkdown } from "../utils/markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: SourceChunk[];
  error?: string | null;
}

interface QAPanelProps {
  documentId: string;
}

export const QAPanel: React.FC<QAPanelProps> = ({ documentId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { text, sources, isLoading, error, startStream, stopStream, resetStream } = useAIStream();
  const threadEndRef = useRef<HTMLDivElement>(null);
  
  const activeStreamMessageRef = useRef<string | null>(null);

  // Reset panel state on document switch
  useEffect(() => {
    setMessages([]);
    setInput("");
    resetStream();
    activeStreamMessageRef.current = null;
  }, [documentId, resetStream]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, text]);

  // Synchronize active stream tokens into the message list
  useEffect(() => {
    if (isLoading && activeStreamMessageRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === activeStreamMessageRef.current
            ? { ...msg, text, sources }
            : msg
        )
      );
    }
  }, [text, sources, isLoading]);

  // Synchronize stream error state into active message
  useEffect(() => {
    if (error && activeStreamMessageRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === activeStreamMessageRef.current
            ? { ...msg, error }
            : msg
        )
      );
    }
  }, [error]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    setInput("");

    // Append User Message
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: userQuestion },
      { id: assistantMsgId, role: "assistant", text: "", sources: [] },
    ]);

    activeStreamMessageRef.current = assistantMsgId;

    try {
      // 1. Get Signed stream token from Express
      const { url } = await getStreamToken(documentId, "qa", { question: userQuestion });
      // 2. Start SSE token streaming
      startStream(url);
    } catch (err: any) {
      console.error("Failed to start QA stream:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, error: err?.response?.data?.message || "Failed to start streaming" }
            : msg
        )
      );
    }
  };



  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Thread messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <Bot className="w-12 h-12 text-primary-accent/40 mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-text-secondary mb-1">Ask anything about this document</h4>
            <p className="text-xs max-w-[280px]">
              Query decisions, specifications, or general details. AI will ground replies using relevant text chunks.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[90%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar Icon */}
              <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border ${
                isUser 
                  ? "bg-primary-accent/10 border-primary-accent/20 text-primary-accent" 
                  : "bg-surface-elevated border-white/5 text-text-secondary"
              }`}>
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Box */}
              <div className="flex flex-col gap-1.5">
                <div className={`p-3 rounded-2xl text-sm ${
                  isUser 
                    ? "bg-primary-accent text-main-bg font-medium rounded-tr-none" 
                    : "bg-surface-elevated border border-white/5 rounded-tl-none text-text-secondary"
                }`}>
                  {msg.error ? (
                    <div className="flex items-center gap-2 text-danger">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{msg.error}</span>
                    </div>
                  ) : msg.text ? (
                    isUser ? <p className="leading-relaxed">{msg.text}</p> : <div className="space-y-1">{parseMarkdown(msg.text)}</div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-1.5 h-1.5 bg-primary-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-primary-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-primary-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>

                {/* Grounding Sources for LLM replies */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-col gap-1 px-1">
                    <span className="text-[10px] text-text-muted font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-primary-accent/70" />
                      📎 Grounded Sources:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src, i) => (
                        <div
                          key={i}
                          title={src.chunk_text}
                          className="text-[9px] bg-white/2 hover:bg-white/5 text-text-secondary px-2 py-0.5 rounded border border-white/5 cursor-help transition-all max-w-[200px] truncate"
                        >
                          {src.section_title ? src.section_title.split(" > ").pop() : `Chunk #${i+1}`} ({Math.round(src.similarity*100)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={threadEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-surface-secondary flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this doc..."
          disabled={isLoading}
          className="flex-1 bg-surface-elevated border border-white/5 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-primary-accent/30 transition-colors disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          variant="primary"
          iconOnly
          icon={
            isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )
          }
          className="p-3"
          title="Send query"
        />
      </form>
    </div>
  );
};
