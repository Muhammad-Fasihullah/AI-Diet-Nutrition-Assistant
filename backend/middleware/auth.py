from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from core.config import get_settings
from core.database import get_supabase

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validates the Supabase JWT token from the Authorization header.
    Returns the user payload from the token.
    """
    token = credentials.credentials

    try:
        settings = get_settings()
        # Supabase JWT secret is the JWT secret from your project settings
        # For Supabase tokens, we verify against Supabase directly
        supabase = get_supabase()
        user = supabase.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        return {"user_id": user.user.id, "email": user.user.email}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )
