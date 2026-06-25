import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/server/auth";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { visionCompletion, extractJson } from "@/lib/server/ai";
import { getUserProfileContext } from "@/lib/server/memory";
import { badRequest } from "@/lib/server/errors";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/jpg", "image/webp"]);

function buildFoodPrompt(profileContext: string): string {
  return `You are a professional nutrition analyzer. Analyze the food image provided.

${profileContext}

Identify all food items visible in the image and estimate their nutritional content.

Respond ONLY with valid JSON in this exact format:

{
  "detected_foods": [
    {
      "name": "string",
      "calories": 0,
      "protein_g": 0,
      "carbs_g": 0,
      "fat_g": 0,
      "portion": "string"
    }
  ],
  "total_calories": 0,
  "total_protein": 0,
  "total_carbs": 0,
  "total_fat": 0,
  "goal_assessment": "string",
  "is_suitable": true,
  "explanation": "string",
  "alternatives": ["string"],
  "recommendations": "string"
}`;
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return badRequest("No file uploaded");
    if (!ALLOWED_TYPES.has(file.type)) return badRequest("Invalid file type. Allowed: JPEG, PNG, WEBP");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > MAX_FILE_SIZE) return badRequest("File too large (max 10MB)");
    if (buffer.length === 0) return badRequest("Empty file");

    const imgB64 = buffer.toString("base64");
    const profileContext = await getUserProfileContext(user.user_id);
    const prompt = buildFoodPrompt(profileContext);

    const raw = await visionCompletion(prompt, [imgB64], {
      temperature: 0.3,
      maxTokens: 1500,
      jsonMode: true,
    });

    let analysis: Record<string, unknown>;
    try {
      analysis = extractJson(raw) as Record<string, unknown>;
    } catch {
      analysis = {
        detected_foods: [{ name: "Unidentified", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, portion: "unknown" }],
        total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0,
        goal_assessment: "Could not analyze the image clearly.",
        is_suitable: false,
        explanation: "The image could not be fully analyzed.",
        alternatives: ["Try uploading a clearer image"],
        recommendations: "Please retry with a well-lit, clear photo.",
      };
    }

    const detectedFoodStr = (analysis.detected_foods as Array<{ name: string }>)
      ?.map((f) => f.name)
      .join(", ") || "Unknown";

    const supabase = getSupabaseAdmin();
    const { data: saved, error } = await supabase
      .from("image_analysis")
      .insert({
        user_id: user.user_id,
        image_url: null,
        detected_food: detectedFoodStr,
        analysis_result: analysis,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ detail: error.message }, { status: 400 });

    return NextResponse.json({
      id: saved.id,
      analysis,
      created_at: saved.created_at,
    });
  });
}
