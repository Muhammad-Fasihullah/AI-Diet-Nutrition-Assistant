import { getSupabaseAdmin } from "./supabase-admin";
import { chatCompletion } from "./ai";

export async function getUserProfileContext(userId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) return "No profile available.";

  return `USER PROFILE:
- Name: ${data.name}
- Age: ${data.age} years
- Gender: ${data.gender}
- Weight: ${data.weight} kg
- Height: ${data.height} cm
- BMI: ${data.bmi} (${data.bmi_category})
- Activity Level: ${data.activity_level}
- Goal: ${String(data.goal).replace(/_/g, " ")}`;
}

export async function getShortTermMemory(
  userId: string,
  limit = 10
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("chat_history")
    .select("role, message")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return [...(data || [])]
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.message }));
}

export async function getLongTermMemory(userId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("user_memory")
    .select("memory_summary")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.memory_summary || "";
}

export async function saveMessage(
  userId: string,
  role: string,
  message: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("chat_history")
    .insert({ user_id: userId, role, message })
    .select()
    .single();

  return (data as Record<string, unknown>) || {};
}

export async function getChatCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("chat_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return count || 0;
}

export async function updateMemorySummary(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: history } = await supabase
    .from("chat_history")
    .select("role, message")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!history || history.length === 0) return;

  const chatText = [...history]
    .reverse()
    .map((m) => `${m.role}: ${m.message}`)
    .join("\n");

  const existingMemory = await getLongTermMemory(userId);

  const prompt = `You are a memory consolidation system for a nutrition assistant.

Existing memory about this user:
${existingMemory || "(no previous memory)"}

Recent conversation:
${chatText}

Update the user's long-term memory. Extract and remember:
- Food preferences (likes/dislikes)
- Dietary habits and patterns
- Cravings mentioned
- Health concerns or restrictions
- Goals progress

Return a concise bullet-point memory (max 8 bullets). Format as plain text, one bullet per line starting with "-".

Memory:`;

  try {
    const summary = await chatCompletion(
      [{ role: "user", content: prompt }],
      { temperature: 0.3, maxTokens: 400 }
    );

    await supabase.from("user_memory").upsert({
      user_id: userId,
      memory_summary: summary.trim(),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Memory update failed:", e);
  }
}

export async function buildChatContext(
  userId: string,
  currentMessage: string
): Promise<Array<{ role: "system" | "user" | "assistant"; content: string }>> {
  const [profileContext, longTerm, shortTerm] = await Promise.all([
    getUserProfileContext(userId),
    getLongTermMemory(userId),
    getShortTermMemory(userId, 10),
  ]);

  const systemPrompt = `You are a friendly, professional AI nutrition assistant. You provide personalized food and nutrition advice based on the user's profile, goals, and conversation history.

${profileContext}

LONG-TERM MEMORY ABOUT THIS USER:
${longTerm || "(No previous patterns recorded yet)"}

YOUR GUIDELINES:
1. ALWAYS personalize advice based on the user's BMI, weight goal, and activity level.
2. Be conversational, warm, and supportive — not clinical.
3. If the user mentions a specific food, evaluate it against their goal honestly.
4. If they ask for alternatives, suggest 2-3 realistic options.
5. Mention calorie estimates are approximate (never exact).
6. NEVER give medical advice. For medical questions, suggest consulting a doctor.
7. Keep responses concise (3-6 sentences) unless the user asks for detail.
8. Reference their long-term memory naturally when relevant ("I remember you prefer...").

If the user disagrees or pushes back, adapt your advice — suggest healthier versions instead of repeating the same answer.`;

  return [
    { role: "system", content: systemPrompt },
    ...shortTerm,
    { role: "user", content: currentMessage },
  ];
}
