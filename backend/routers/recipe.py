"""
Recipe generator router.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from middleware.auth import get_current_user
from services.recipe_service import generate_recipes_from_images
from core.database import get_supabase

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB per image
MAX_IMAGES = 5
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


@router.post("")
async def generate_recipe(
    files: list[UploadFile] = File(...),
    user=Depends(get_current_user),
):
    """Generate personalized recipes from ingredient images."""
    if not files:
        raise HTTPException(status_code=400, detail="At least one image required")

    if len(files) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES} images allowed")

    image_bytes_list = []
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.filename}. Allowed: JPEG, PNG, WEBP"
            )
        data = await file.read()
        if len(data) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"{file.filename} too large (max 10MB each)")
        if len(data) == 0:
            raise HTTPException(status_code=400, detail=f"{file.filename} is empty")
        image_bytes_list.append(data)

    try:
        result = generate_recipes_from_images(user["user_id"], image_bytes_list)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recipe generation failed: {str(e)}")


@router.get("/history")
async def get_history(user=Depends(get_current_user)):
    """Returns past recipe generations for the user."""
    supabase = get_supabase()
    result = (
        supabase.table("recipe_requests")
        .select("id, detected_ingredients, final_output, created_at")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )
    return result.data or []