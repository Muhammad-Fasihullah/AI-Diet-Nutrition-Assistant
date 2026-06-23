from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from core.database import get_supabase

router = APIRouter()


@router.get("/stats")
async def get_stats(user=Depends(get_current_user)):
    supabase = get_supabase()
    uid = user["user_id"]

    profile = supabase.table("profiles").select("*").eq("user_id", uid).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    chats = supabase.table("chat_history").select("count", count="exact").eq("user_id", uid).execute()
    analyses = supabase.table("image_analysis").select("count", count="exact").eq("user_id", uid).execute()
    recipes = supabase.table("recipe_requests").select("count", count="exact").eq("user_id", uid).execute()
    recent = (
        supabase.table("chat_history")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    return {
        "profile": profile.data,
        "total_chats": chats.count or 0,
        "total_analyses": analyses.count or 0,
        "total_recipes": recipes.count or 0,
        "recent_chats": recent.data or [],
    }
