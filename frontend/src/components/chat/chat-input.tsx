"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  function handleSubmit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t bg-white shrink-0">
      <div className="max-w-3xl mx-auto p-4">
        <div className="relative flex items-end gap-2 rounded-2xl border bg-white shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about nutrition..."
            rows={1}
            disabled={disabled}
            className={cn(
              "flex-1 resize-none bg-transparent px-4 py-3 text-sm",
              "placeholder:text-muted-foreground focus:outline-none",
              "min-h-[44px] max-h-[200px]",
              "disabled:opacity-50"
            )}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="m-1.5 h-9 w-9 shrink-0 rounded-xl"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI responses are personalized but calorie estimates may not be exact.
        </p>
      </div>
    </div>
  );
}
