from fastapi import APIRouter, Depends, HTTPException
from models.schemas import ProfileCreate, ProfileUpdate, ProfileResponse
from middleware.auth import get_current_user
from core.database import get_supabase
from datetime import datetime, timezone

router = APIRouter()


def calculate_bmi(weight: float, height: float) -> tuple[float, str]:
    height_m = height / 100
    bmi = round(weight / (height_m ** 2), 1)
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25:
        category = "Normal"
    elif bmi < 30:
        category = "Overweight"
    else:
        category = "Obese"
    return bmi, category


@router.post("", response_model=ProfileResponse)
async def create_profile(body: ProfileCreate, user=Depends(get_current_user)):
    supabase = get_supabase()
    bmi, category = calculate_bmi(body.weight, body.height)

    data = {
        "user_id": user["user_id"],
        "name": body.name,
        "age": body.age,
        "gender": body.gender,
        "weight": body.weight,
        "height": body.height,
        "bmi": bmi,
        "bmi_category": category,
        "activity_level": body.activity_level,
        "goal": body.goal,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    result = supabase.table("profiles").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Could not create profile")
    return result.data[0]


@router.get("", response_model=ProfileResponse)
async def get_profile(user=Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("user_id", user["user_id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete profile setup.")
    return result.data


@router.put("", response_model=ProfileResponse)
async def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    supabase = get_supabase()
    bmi, category = calculate_bmi(body.weight, body.height)

    data = {
        "name": body.name,
        "age": body.age,
        "gender": body.gender,
        "weight": body.weight,
        "height": body.height,
        "bmi": bmi,
        "bmi_category": category,
        "activity_level": body.activity_level,
        "goal": body.goal,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    result = (
        supabase.table("profiles")
        .update(data)
        .eq("user_id", user["user_id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Could not update profile")
    return result.data[0]
