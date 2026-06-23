"""
Food image analysis service.
"""
import base64
from services.ai_service import vision_completion, extract_json
from services.memory_service import get_user_profile_context
from core.database import get_supabase


def build_food_analysis_prompt(profile_context: str) -> str:
    """System prompt for food image analysis."""
    return f"""You are a professional nutrition analyzer. Analyze the food image provided.

{profile_context}

Identify all food items visible in the image, estimate their nutritional content, and assess whether the meal aligns with the user's goal.

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):

{{
  "detected_foods": [
    {{
      "name": "string (food item name)",
      "calories": number (integer),
      "protein_g": number (decimal),
      "carbs_g": number (decimal),
      "fat_g": number (decimal),
      "portion": "string (e.g. '1 cup', '200g', '1 slice')"
    }}
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "goal_assessment": "string (1-2 sentences on whether this meal supports the user's goal)",
  "is_suitable": boolean (true if it supports their goal, false if not ideal),
  "explanation": "string (2-3 sentences explaining WHY — be specific to their BMI/goal)",
  "alternatives": ["string", "string", "string"] (3 healthier alternative meal ideas),
  "recommendations": "string (1-2 actionable tips for this user)"
}}

IMPORTANT:
- All nutritional values are estimates — be reasonable.
- Be specific to the user's profile (BMI, goal, activity level).
- If you cannot identify the food clearly, return a single item named "Unidentified Food" with conservative estimates and explain in the recommendations.
- Always be encouraging but honest."""


def analyze_food_image(user_id: str, image_bytes: bytes) -> dict:
    """
    Analyzes a food image using Vision LLM.
    Returns structured nutrition data.
    """
    # Encode image
    img_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # Get user context
    profile_context = get_user_profile_context(user_id)
    prompt = build_food_analysis_prompt(profile_context)

    # Call Vision LLM
    raw = vision_completion(
        prompt=prompt,
        image_base64_list=[img_b64],
        temperature=0.3,
        max_tokens=1500,
        json_mode=True,
    )

    # Parse JSON
    try:
        analysis = extract_json(raw)
    except Exception as e:
        # Fallback structure
        analysis = {
            "detected_foods": [{
                "name": "Unidentified",
                "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0,
                "portion": "unknown"
            }],
            "total_calories": 0, "total_protein": 0, "total_carbs": 0, "total_fat": 0,
            "goal_assessment": "Could not analyze the image clearly.",
            "is_suitable": False,
            "explanation": f"The image could not be fully analyzed: {str(e)}",
            "alternatives": ["Try uploading a clearer image"],
            "recommendations": "Please retry with a well-lit, clear photo of the food."
        }

    # Ensure all required fields exist
    analysis.setdefault("detected_foods", [])
    analysis.setdefault("total_calories", 0)
    analysis.setdefault("total_protein", 0)
    analysis.setdefault("total_carbs", 0)
    analysis.setdefault("total_fat", 0)
    analysis.setdefault("goal_assessment", "")
    analysis.setdefault("is_suitable", False)
    analysis.setdefault("explanation", "")
    analysis.setdefault("alternatives", [])
    analysis.setdefault("recommendations", "")

    # Detected food summary string
    detected_food_str = ", ".join([f["name"] for f in analysis["detected_foods"]])

    # Save to database
    supabase = get_supabase()
    result = supabase.table("image_analysis").insert({
        "user_id": user_id,
        "image_url": None,  # We're not storing images for MVP
        "detected_food": detected_food_str,
        "analysis_result": analysis,
    }).execute()

    saved_id = result.data[0]["id"] if result.data else ""
    return {
        "id": saved_id,
        "analysis": analysis,
        "created_at": result.data[0]["created_at"] if result.data else "",
    }