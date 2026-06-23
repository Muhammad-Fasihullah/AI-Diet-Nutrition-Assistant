"""
Memory Service — handles persistent ChatGPT-style memory.

Three layers:
1. Short-term: Last 10 messages from chat_history
2. Long-term: memory_summary in user_memory table
3. Context injection: User profile + BMI + Goal
"""
from core.database import get_supabase
from services.ai_service import chat_completion
from datetime import datetime, timezone


def get_user_profile_context(user_id: str) -> str:
    """Fetches user profile and formats it as a context string for prompts."""
    supabase = get_supabase()
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not result.data:
        return "No profile available."

    p = result.data
    return f"""USER PROFILE:
- Name: {p['name']}
- Age: {p['age']} years
- Gender: {p['gender']}
- Weight: {p['weight']} kg
- Height: {p['height']} cm
- BMI: {p['bmi']} ({p['bmi_category']})
- Activity Level: {p['activity_level']}
- Goal: {p['goal'].replace('_', ' ').title()}"""


def get_short_term_memory(user_id: str, limit: int = 10) -> list[dict]:
    """Returns last N messages formatted as OpenAI-style messages."""
    supabase = get_supabase()
    result = (
        supabase.table("chat_history")
        .select("role, message")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    # Reverse to chronological order
    messages = list(reversed(result.data or []))
    return [{"role": m["role"], "content": m["message"]} for m in messages]


def get_long_term_memory(user_id: str) -> str:
    """Returns the saved memory summary or empty string."""
    supabase = get_supabase()
    result = (
        supabase.table("user_memory")
        .select("memory_summary")
        .eq("user_id", user_id)
        .execute()
    )

    if result.data and len(result.data) > 0:
        return result.data[0].get("memory_summary", "") or ""
    return ""


def save_message(user_id: str, role: str, message: str) -> dict:
    """Saves a single message to chat_history. Returns inserted row."""
    supabase = get_supabase()
    data = {
        "user_id": user_id,
        "role": role,
        "message": message,
    }
    result = supabase.table("chat_history").insert(data).execute()
    return result.data[0] if result.data else {}


def get_chat_count(user_id: str) -> int:
    """Returns total chat messages for this user."""
    supabase = get_supabase()
    result = (
        supabase.table("chat_history")
        .select("count", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    return result.count or 0


def update_memory_summary(user_id: str) -> None:
    """
    Generates a long-term memory summary using the LLM.
    Called every 10 messages to keep memory updated.
    """
    supabase = get_supabase()

    # Get the most recent 20 messages for summarization
    history = (
        supabase.table("chat_history")
        .select("role, message")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    if not history.data:
        return

    chronological = list(reversed(history.data))
    chat_text = "\n".join([f"{m['role']}: {m['message']}" for m in chronological])

    # Get existing memory to merge with
    existing_memory = get_long_term_memory(user_id)

    summary_prompt = f"""You are a memory consolidation system for a nutrition assistant.

Existing memory about this user:
{existing_memory or "(no previous memory)"}

Recent conversation:
{chat_text}

Update the user's long-term memory. Extract and remember:
- Food preferences (likes/dislikes)
- Dietary habits and patterns
- Cravings mentioned
- Health concerns or restrictions
- Goals progress
- Mood patterns related to food

Return a concise bullet-point memory (max 8 bullets). Be specific.
Format as plain text, one bullet per line starting with "-".

Memory:"""

    try:
        summary = chat_completion(
            messages=[{"role": "user", "content": summary_prompt}],
            temperature=0.3,
            max_tokens=400,
        )

        # Upsert into user_memory
        supabase.table("user_memory").upsert({
            "user_id": user_id,
            "memory_summary": summary.strip(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

    except Exception as e:
        # Don't fail the main chat flow if memory update fails
        print(f"Memory update failed for {user_id}: {e}")


def build_chat_context(user_id: str, current_message: str) -> list[dict]:
    """
    Builds the complete message context for the LLM, including:
    - System prompt with user profile + long-term memory
    - Short-term message history
    - Current user message
    """
    profile_context = get_user_profile_context(user_id)
    long_term = get_long_term_memory(user_id)
    short_term = get_short_term_memory(user_id, limit=10)

    system_prompt = f"""You are a friendly, professional AI nutrition assistant. You provide personalized food and nutrition advice based on the user's profile, goals, and conversation history.

{profile_context}

LONG-TERM MEMORY ABOUT THIS USER:
{long_term if long_term else "(No previous patterns recorded yet)"}

YOUR GUIDELINES:
1. ALWAYS personalize advice based on the user's BMI, weight goal, and activity level.
2. Be conversational, warm, and supportive — not clinical.
3. Recognize moods (stressed, sad, lazy, craving comfort food) and adapt your suggestions.
4. If the user mentions a specific food, evaluate it against their goal honestly.
5. If they ask for alternatives, suggest 2-3 realistic options.
6. Mention calorie estimates ARE approximate (never exact).
7. NEVER give medical advice. For medical questions, suggest consulting a doctor.
8. Use simple language. Avoid jargon unless asked for detail.
9. Keep responses concise (3-6 sentences) unless the user asks for detail.
10. Reference their long-term memory naturally when relevant ("I remember you prefer...").

If the user disagrees or pushes back, adapt your advice — suggest healthier versions of what they want instead of repeating the same answer."""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(short_term)
    messages.append({"role": "user", "content": current_message})

    return messages
