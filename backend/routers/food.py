"""
Food analysis router.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from middleware.auth import get_current_user
from services.food_service import analyze_food_image
from core.database import get_supabase

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


@router.post("")
async def analyze_food(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """Analyze a food image and return nutrition data."""
    # Validate
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: JPEG, PNG, WEBP"
        )

    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        result = analyze_food_image(user["user_id"], image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/history")
async def get_history(user=Depends(get_current_user)):
    """Returns all past food analyses for the user."""
    supabase = get_supabase()
    result = (
        supabase.table("image_analysis")
        .select("id, detected_food, analysis_result, created_at")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []