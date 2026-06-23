"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import { Salad, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  streaming?: boolean;
}

export function ChatMessage({ role, content, timestamp, streaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 message-appear", isUser && "flex-row-reverse")}>
      <Avatar className={cn("h-9 w-9 shrink-0", isUser ? "bg-brand-100" : "bg-blue-100")}>
        <AvatarFallback className={cn(
          "text-xs",
          isUser ? "bg-brand-100 text-brand-700" : "bg-blue-100 text-blue-700"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Salad className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-brand-600 text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm border"
        )}>
          <p className="whitespace-pre-wrap break-words">
            {content}
            {streaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm align-middle" />}
          </p>
        </div>
        {timestamp && !streaming && (
          <span className="text-xs text-muted-foreground px-2">
            {formatDate(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
