import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/server/auth";
import { ChatRequestSchema } from "@/lib/server/schemas";
import { badRequest } from "@/lib/server/errors";
import { buildChatContext, saveMessage, getChatCount, updateMemorySummary } from "@/lib/server/memory";
import { chatCompletion } from "@/lib/server/ai";

export async function POST(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Invalid input");
    }

    const userMessage = parsed.data.message.trim();
    if (!userMessage) return badRequest("Message cannot be empty");

    const userId = user.user_id;

    await saveMessage(userId, "user", userMessage);
    const messages = await buildChatContext(userId, userMessage);
    const aiReply = await chatCompletion(messages, { temperature: 0.7, maxTokens: 800 });
    const saved = await saveMessage(userId, "assistant", aiReply);

    const count = await getChatCount(userId);
    if (count > 0 && count % 10 === 0) {
      updateMemorySummary(userId);
    }

    return NextResponse.json({
      reply: aiReply,
      message_id: (saved as { id?: string }).id || "",
    });
  });
}
