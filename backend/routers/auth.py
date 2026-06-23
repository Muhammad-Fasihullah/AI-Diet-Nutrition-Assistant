from fastapi import APIRouter, HTTPException
from models.schemas import SignupRequest, LoginRequest
from core.database import get_supabase

router = APIRouter()


@router.post("/signup")
async def signup(body: SignupRequest):
    supabase = get_supabase()
    try:
        result = supabase.auth.sign_up({"email": body.email, "password": body.password})
        if result.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")
        return {"message": "Account created successfully", "user_id": result.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(body: LoginRequest):
    supabase = get_supabase()
    try:
        result = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
        return {
            "access_token": result.session.access_token,
            "token_type": "bearer",
            "user_id": result.user.id,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")
