"""
Recipe generation service — vision LLM detects ingredients,
then text LLM generates 3 ranked personalized recipes.
"""
import base64
from services.ai_service import vision_completion, chat_completion, extract_json
from services.memory_service import get_user_profile_context
from core.database import get_supabase


def detect_ingredients_from_images(image_bytes_list: list[bytes]) -> list[str]:
    """
    Uses Vision LLM to detect ingredients from one or more images.
    Returns a deduplicated list of ingredient names.
    """
    image_b64_list = [base64.b64encode(b).decode("utf-8") for b in image_bytes_list]

    prompt = """You are an ingredient detection system. Identify all food ingredients visible in the image(s).

Return ONLY valid JSON in this exact format (no markdown, no extra text):

{
  "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
}

RULES:
- List individual raw ingredients (e.g. "chicken breast", "tomato", "onion", "rice")
- Use simple, common names (lowercase)
- Don't include cooked dishes — only raw/individual items
- If you see multiple of the same ingredient, list it once
- Include at least 1 ingredient, max 15
- If you cannot identify anything, return {"ingredients": []}"""

    raw = vision_completion(
        prompt=prompt,
        image_base64_list=image_b64_list,
        temperature=0.2,
        max_tokens=500,
        json_mode=True,
    )

    try:
        data = extract_json(raw)
        ingredients = data.get("ingredients", [])
        # Dedupe + clean
        seen = set()
        result = []
        for ing in ingredients:
            ing_clean = str(ing).strip().lower()
            if ing_clean and ing_clean not in seen:
                seen.add(ing_clean)
                result.append(ing_clean)
        return result
    except Exception:
        return []


def generate_ranked_recipes(user_id: str, ingredients: list[str]) -> dict:
    """
    Generates 3 personalized ranked recipes based on detected ingredients and user profile.
    Returns: { best_match, alternative, quick_option }
    """
    profile_context = get_user_profile_context(user_id)
    ingredients_str = ", ".join(ingredients) if ingredients else "no ingredients detected"

    prompt = f"""You are a professional chef and nutritionist. Generate 3 personalized recipes using the available ingredients.

{profile_context}

AVAILABLE INGREDIENTS: {ingredients_str}

Generate exactly 3 recipes ranked by relevance to the user's goal:
1. BEST MATCH — the optimal recipe for their goal/BMI/activity level
2. ALTERNATIVE — a different style but still healthy and goal-aligned
3. QUICK OPTION — fastest to prepare (under 20 mins)

You may suggest 1-2 common pantry additions per recipe (salt, oil, spices, basic items) but rely mostly on the listed ingredients.

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):

{{
  "best_match": {{
    "recipe": {{
      "id": "rec_1",
      "name": "string (recipe name)",
      "description": "string (1 sentence)",
      "ingredients": ["item1 (amount)", "item2 (amount)"],
      "calories": number (integer per serving),
      "protein": number (grams),
      "carbs": number (grams),
      "fats": number (grams),
      "prep_time": number (total minutes),
      "difficulty": "easy" or "medium" or "hard",
      "steps": ["step 1", "step 2", "step 3", "step 4"],
      "tags": ["tag1", "tag2"]
    }},
    "rank": 1,
    "reason": "string (2 sentences explaining WHY this is best for THIS user)",
    "modifications": ["modification 1", "modification 2"]
  }},
  "alternative": {{
    "recipe": {{ ...same structure with id "rec_2"... }},
    "rank": 2,
    "reason": "string",
    "modifications": ["string"]
  }},
  "quick_option": {{
    "recipe": {{ ...same structure with id "rec_3"... }},
    "rank": 3,
    "reason": "string",
    "modifications": ["string"]
  }}
}}

IMPORTANT:
- Personalize based on the user's BMI, goal, and activity level
- For weight loss → lower calorie, high protein recipes
- For weight gain → higher calorie, balanced macros
- For maintain → balanced, moderate portions
- Steps must be clear and numbered (4-6 steps each)
- Calories are per serving estimates
- All values are approximations"""

    raw = chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
        max_tokens=2500,
        json_mode=True,
    )

    try:
        recipes = extract_json(raw)
    except Exception as e:
        raise Exception(f"Could not parse recipe response: {str(e)}")

    return recipes


def generate_recipes_from_images(user_id: str, image_bytes_list: list[bytes]) -> dict:
    """
    Full workflow: detect ingredients → generate recipes → save to DB.
    """
    # Step 1: Detect ingredients via vision
    ingredients = detect_ingredients_from_images(image_bytes_list)

    if not ingredients:
        raise Exception("Could not detect any ingredients. Please try clearer images.")

    # Step 2: Generate ranked recipes via text LLM
    recipes_output = generate_ranked_recipes(user_id, ingredients)

    # Step 3: Save to DB
    final_output = {
        "detected_ingredients": ingredients,
        **recipes_output,
    }

    supabase = get_supabase()
    result = supabase.table("recipe_requests").insert({
        "user_id": user_id,
        "detected_ingredients": ingredients,
        "final_output": final_output,
    }).execute()

    saved_id = result.data[0]["id"] if result.data else ""
    return {
        "id": saved_id,
        "output": final_output,
        "created_at": result.data[0]["created_at"] if result.data else "",
    }