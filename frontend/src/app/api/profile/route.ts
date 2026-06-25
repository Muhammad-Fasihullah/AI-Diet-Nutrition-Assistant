import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/server/auth";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { calculateBMI } from "@/lib/server/utils";
import { ProfileSchema } from "@/lib/server/schemas";
import { badRequest } from "@/lib/server/errors";

// ─── POST /api/profile — Create profile ──────────────────────────────────────
export async function POST(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const body = await req.json();

    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Invalid input");
    }

    const data = parsed.data;
    const { bmi, category } = calculateBMI(data.weight, data.height);

    const supabase = getSupabaseAdmin();
    const { data: result, error } = await supabase
      .from("profiles")
      .insert({
        user_id: user.user_id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        bmi,
        bmi_category: category,
        activity_level: data.activity_level,
        goal: data.goal,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(result);
  });
}

// ─── GET /api/profile — Get profile ──────────────────────────────────────────
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.user_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { detail: "Profile not found. Please complete profile setup." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  });
}

// ─── PUT /api/profile — Update profile ───────────────────────────────────────
export async function PUT(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const body = await req.json();

    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Invalid input");
    }

    const data = parsed.data;
    const { bmi, category } = calculateBMI(data.weight, data.height);

    const supabase = getSupabaseAdmin();
    const { data: result, error } = await supabase
      .from("profiles")
      .update({
        name: data.name,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        bmi,
        bmi_category: category,
        activity_level: data.activity_level,
        goal: data.goal,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.user_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(result);
  });
}