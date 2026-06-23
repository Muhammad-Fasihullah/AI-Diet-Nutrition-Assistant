"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, MessageCircle, Salad, Trash2,
  Pizza, Coffee, Apple, Dumbbell,
} from "lucide-react";

const SUGGESTIONS = [
  { icon: Pizza, text: "Can I eat pizza today?" },
  { icon: Apple, text: "Suggest a healthy snack" },
  { icon: Coffee, text: "What should I eat for breakfast?" },
  { icon: Dumbbell, text: "Best food after gym?" },
];

export default function ChatPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [streamingReply, setStreamingReply] = useState<string | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["chat-history"],
    queryFn: async () => {
      const res = await chatAPI.getHistory();
      return res.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await chatAPI.sendMessage(message);
      return res.data;
    },
    onMutate: async (message) => {
      // Optimistic: show user's message immediately
      await queryClient.cancelQueries({ queryKey: ["chat-history"] });
      const previous = queryClient.getQueryData(["chat-history"]);

      queryClient.setQueryData(["chat-history"], (old: any) => [
        ...(old || []),
        {
          id: "temp-" + Date.now(),
          role: "user",
          message,
          created_at: new Date().toISOString(),
        },
      ]);

      setStreamingReply("");
      return { previous };
    },
    onSuccess: (data) => {
      // Animate the AI reply character-by-character
      const fullReply = data.reply;
      let i = 0;
      const interval = setInterval(() => {
        i += 3;
        setStreamingReply(fullReply.slice(0, i));
        if (i >= fullReply.length) {
          clearInterval(interval);
          setStreamingReply(null);
          queryClient.invalidateQueries({ queryKey: ["chat-history"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      }, 15);
    },
    onError: (err: unknown, _msg, context: any) => {
      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(["chat-history"], context.previous);
      }
      setStreamingReply(null);
      toast({
        variant: "destructive",
        title: "Could not send message",
        description: err instanceof Error ? err.message : "Try again",
      });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => await chatAPI.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Chat cleared", description: "Starting fresh." });
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, streamingReply]);

  const isEmpty = !isLoading && (!history || history.length === 0);
  const isSending = sendMutation.isPending || streamingReply !== null;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -mx-6 -my-6 bg-background">
      {/* Header */}
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 rounded-lg">
            <MessageCircle className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">AI Nutrition Assistant</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              Personalized to your profile
            </p>
          </div>
        </div>

        {history && history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Clear all chat history? This also resets the AI memory.")) {
                clearMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-20 flex-1 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <EmptyState onSuggest={(text) => sendMutation.mutate(text)} />
          ) : (
            <div className="space-y-4">
              {history?.map((msg: any) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.message}
                  timestamp={msg.created_at}
                />
              ))}
              {/* Streaming reply */}
              {streamingReply !== null && (
                <ChatMessage
                  role="assistant"
                  content={streamingReply || "..."}
                  streaming
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={(text) => sendMutation.mutate(text)}
        disabled={isSending}
      />
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="inline-flex p-4 bg-brand-100 rounded-2xl mb-4">
        <Salad className="h-10 w-10 text-brand-600" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">
        Hi! I&apos;m your AI nutrition coach
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Ask me anything about food, meals, or nutrition. I&apos;ll personalize advice based on
        your profile, BMI, and goals.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        {SUGGESTIONS.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onSuggest(text)}
            className="flex items-center gap-3 p-4 rounded-xl border bg-white hover:border-brand-300 hover:bg-brand-50 transition-all text-left group"
          >
            <div className="p-2 bg-brand-100 rounded-lg group-hover:scale-110 transition-transform">
              <Icon className="h-4 w-4 text-brand-600" />
            </div>
            <span className="text-sm font-medium">{text}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs">
        <Sparkles className="h-3.5 w-3.5" />
        <span>I remember our past conversations</span>
      </div>
    </div>
  );
}
