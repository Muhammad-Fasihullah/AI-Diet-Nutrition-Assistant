from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# ─── Auth ─────────────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ─── Profile ──────────────────────────────────────────────────────────────────
class ProfileCreate(BaseModel):
    name: str
    age: int = Field(ge=1, le=120)
    gender: Literal["male", "female", "other"]
    weight: float = Field(gt=0, description="Weight in kg")
    height: float = Field(gt=0, description="Height in cm")
    activity_level: Literal["sedentary", "light", "moderate", "active"]
    goal: Literal["weight_loss", "weight_gain", "maintain"]


class ProfileUpdate(ProfileCreate):
    pass


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    age: int
    gender: str
    weight: float
    height: float
    bmi: float
    bmi_category: str
    activity_level: str
    goal: str
    created_at: str
    updated_at: Optional[str] = None


# ─── Chat ─────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    reply: str
    message_id: str


class ChatHistoryItem(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    message: str
    created_at: str


# ─── Food Analysis ────────────────────────────────────────────────────────────
class FoodItem(BaseModel):
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    portion: str


class FoodAnalysisResult(BaseModel):
    detected_foods: list[FoodItem]
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    goal_assessment: str
    is_suitable: bool
    explanation: str
    alternatives: list[str]
    recommendations: str


class FoodAnalysisResponse(BaseModel):
    id: str
    analysis: FoodAnalysisResult
    image_url: Optional[str] = None
    created_at: str


# ─── Recipe ───────────────────────────────────────────────────────────────────
class RecipeBase(BaseModel):
    id: str
    name: str
    description: str
    ingredients: list[str]
    calories: int
    protein: float
    carbs: float
    fats: float
    prep_time: int
    difficulty: Literal["easy", "medium", "hard"]
    steps: list[str]
    tags: list[str]


class RankedRecipe(BaseModel):
    recipe: RecipeBase
    rank: int
    reason: str
    modifications: list[str]


class RecipeOutput(BaseModel):
    best_match: RankedRecipe
    alternative: RankedRecipe
    quick_option: RankedRecipe
    detected_ingredients: list[str]


class RecipeResponse(BaseModel):
    id: str
    output: RecipeOutput
    created_at: str


# ─── Dashboard ────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    profile: ProfileResponse
    total_chats: int
    total_analyses: int
    total_recipes: int
    recent_chats: list[ChatHistoryItem]
