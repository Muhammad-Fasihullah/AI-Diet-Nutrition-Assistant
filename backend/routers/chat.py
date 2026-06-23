"""
Chat router — handles AI chat with persistent memory.
"""
from fastapi import APIRouter, Depends, HTTPException
from models.schemas import ChatRequest, ChatResponse, ChatHistoryItem
from middleware.auth import get_current_user
from services.ai_service import chat_completion
from services.memory_service import (
    build_chat_context,
    save_message,
    get_chat_count,
    update_memory_summary,
)
from core.database import get_supabase

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, user=Depends(get_current_user)):
    """
    Main chat endpoint.

    Workflow:
    1. Save user message
    2. Build context (profile + memory + history)
    3. Call LLM
    4. Save assistant response
    5. Every 10 messages: update long-term memory
    """
    uid = user["user_id"]
    user_message = body.message.strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Step 1: Save user message
        save_message(uid, "user", user_message)

        # Step 2 & 3: Build context and get AI response
        messages = build_chat_context(uid, user_message)
        ai_reply = chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=800,
        )

        # Step 4: Save assistant response
        saved = save_message(uid, "assistant", ai_reply)

        # Step 5: Update long-term memory every 10 messages
        count = get_chat_count(uid)
        if count > 0 and count % 10 == 0:
            update_memory_summary(uid)

        return {"reply": ai_reply, "message_id": saved.get("id", "")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/history", response_model=list[ChatHistoryItem])
async def get_history(user=Depends(get_current_user)):
    """Returns chat history for the current user, oldest first."""
    supabase = get_supabase()
    result = (
        supabase.table("chat_history")
        .select("id, role, message, created_at")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=False)
        .execute()
    )
    return result.data or []


@router.delete("/history")
async def clear_history(user=Depends(get_current_user)):
    """Clears all chat history for the current user."""
    supabase = get_supabase()
    supabase.table("chat_history").delete().eq("user_id", user["user_id"]).execute()
    supabase.table("user_memory").delete().eq("user_id", user["user_id"]).execute()
    return {"message": "Chat history cleared"}
