from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from routers import auth, profile, chat, food, recipe, dashboard

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-powered personalized nutrition assistant",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/profile", tags=["Profile"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
app.include_router(food.router, prefix="/analyze-food", tags=["Food Analysis"])
app.include_router(recipe.router, prefix="/generate-recipe", tags=["Recipe Generator"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])


@app.get("/")
def root():
    return {"message": f"{settings.app_name} API is running", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
