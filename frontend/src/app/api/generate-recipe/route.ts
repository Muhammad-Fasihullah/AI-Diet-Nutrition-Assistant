import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/server/auth";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { visionCompletion, chatCompletion, extractJson } from "@/lib/server/ai";
import { getUserProfileContext } from "@/lib/server/memory";
import { badRequest } from "@/lib/server/errors";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 5;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/jpg", "image/webp"]);

async function detectIngredients(imageBase64List: string[]): Promise<string[]> {
  const prompt = `You are an ingredient detection system. Identify all food ingredients visible in the image(s).

Return ONLY valid JSON:
{"ingredients": ["ingredient1", "ingredient2"]}

Rules:
- List individual raw ingredients (lowercase, simple names)
- Deduplicate — list each ingredient once
- Min 1, max 15 ingredients
- If nothing detected: {"ingredients": []}`;

  const raw = await visionCompletion(prompt, imageBase64List, {
    temperature: 0.2,
    maxTokens: 500,
    jsonMode: true,
  });

  try {
    const data = extractJson(raw) as { ingredients?: unknown[] };
    const ingredients = data.ingredients || [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const ing of ingredients) {
      const clean = String(ing).trim().toLowerCase();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        result.push(clean);
      }
    }
    return result;
  } catch {
    return [];
  }
}

async function generateRankedRecipes(
  userId: string,
  ingredients: string[]
): Promise<Record<string, unknown>> {
  const profileContext = await getUserProfileContext(userId);
  const ingredientsStr = ingredients.join(", ") || "no ingredients detected";

  const prompt = `You are a professional chef and nutritionist. Generate 3 personalized recipes.

${profileContext}

AVAILABLE INGREDIENTS: ${ingredientsStr}

Generate exactly 3 ranked recipes. Respond ONLY with valid JSON:

{
  "best_match": {
    "recipe": {
      "id": "rec_1", "name": "string", "description": "string",
      "ingredients": ["item (amount)"], "calories": 0, "protein": 0, "carbs": 0, "fats": 0,
      "prep_time": 0, "difficulty": "easy", "steps": ["step 1"], "tags": ["tag"]
    },
    "rank": 1, "reason": "string", "modifications": ["string"]
  },
  "alternative": {
    "recipe": { "id": "rec_2", "name": "string", "description": "string",
      "ingredients": ["item (amount)"], "calories": 0, "protein": 0, "carbs": 0, "fats": 0,
      "prep_time": 0, "difficulty": "easy", "steps": ["step 1"], "tags": ["tag"]
    },
    "rank": 2, "reason": "string", "modifications": ["string"]
  },
  "quick_option": {
    "recipe": { "id": "rec_3", "name": "string", "description": "string",
      "ingredients": ["item (amount)"], "calories": 0, "protein": 0, "carbs": 0, "fats": 0,
      "prep_time": 0, "difficulty": "easy", "steps": ["step 1"], "tags": ["tag"]
    },
    "rank": 3, "reason": "string", "modifications": ["string"]
  }
}`;

  const raw = await chatCompletion(
    [{ role: "user", content: prompt }],
    { temperature: 0.6, maxTokens: 2500, jsonMode: true }
  );

  return extractJson(raw) as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) return badRequest("At least one image required");
    if (files.length > MAX_IMAGES) return badRequest(`Maximum ${MAX_IMAGES} images allowed`);

    const imageBase64List: string[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return badRequest(`Invalid file type: ${file.name}. Allowed: JPEG, PNG, WEBP`);
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      if (buffer.length > MAX_FILE_SIZE) return badRequest(`${file.name} too large (max 10MB)`);
      if (buffer.length === 0) return badRequest(`${file.name} is empty`);
      imageBase64List.push(buffer.toString("base64"));
    }

    const ingredients = await detectIngredients(imageBase64List);
    if (ingredients.length === 0) {
      return NextResponse.json(
        { detail: "Could not detect any ingredients. Please try clearer images." },
        { status: 400 }
      );
    }

    const recipesOutput = await generateRankedRecipes(user.user_id, ingredients);
    const finalOutput = { detected_ingredients: ingredients, ...recipesOutput };

    const supabase = getSupabaseAdmin();
    const { data: saved, error } = await supabase
      .from("recipe_requests")
      .insert({
        user_id: user.user_id,
        detected_ingredients: ingredients,
        final_output: finalOutput,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ detail: error.message }, { status: 400 });

    return NextResponse.json({
      id: saved.id,
      output: finalOutput,
      created_at: saved.created_at,
    });
  });
}
