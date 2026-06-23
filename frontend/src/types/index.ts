// ─── Auth ───────────────────────────────────────────────────────────────────
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export type Gender = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal = "weight_loss" | "weight_gain" | "maintain";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  gender: Gender;
  weight: number;       // kg
  height: number;       // cm
  bmi: number;
  bmi_category: string;
  activity_level: ActivityLevel;
  goal: Goal;
  created_at: string;
  updated_at: string;
}

export interface ProfileCreate {
  name: string;
  age: number;
  gender: Gender;
  weight: number;
  height: number;
  activity_level: ActivityLevel;
  goal: Goal;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  user_id: string;
  role: MessageRole;
  message: string;
  created_at: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  message_id: string;
}

// ─── User Memory ──────────────────────────────────────────────────────────────
export interface UserMemory {
  user_id: string;
  memory_summary: string;
  updated_at: string;
}

// ─── Food Analysis ────────────────────────────────────────────────────────────
export interface FoodItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion: string;
}

export interface FoodAnalysisResult {
  detected_foods: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  goal_assessment: string;
  is_suitable: boolean;
  explanation: string;
  alternatives: string[];
  recommendations: string;
}

export interface ImageAnalysis {
  id: string;
  user_id: string;
  image_url: string;
  detected_food: string;
  analysis_result: FoodAnalysisResult;
  created_at: string;
}

// ─── Recipe ───────────────────────────────────────────────────────────────────
export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prep_time: number;     // minutes
  difficulty: "easy" | "medium" | "hard";
  steps: string[];
  tags: string[];
}

export interface RecipeRequest {
  id: string;
  user_id: string;
  detected_ingredients: string[];
  matched_recipes: Recipe[];
  final_output: RecipeOutput;
  created_at: string;
}

export interface RecipeOutput {
  best_match: RankedRecipe;
  alternative: RankedRecipe;
  quick_option: RankedRecipe;
}

export interface RankedRecipe {
  recipe: Recipe;
  rank: number;
  reason: string;
  modifications: string[];
}

// ─── API Error ────────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string;
  status_code?: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  profile: Profile;
  total_chats: number;
  total_analyses: number;
  total_recipes: number;
  recent_chats: ChatMessage[];
}
