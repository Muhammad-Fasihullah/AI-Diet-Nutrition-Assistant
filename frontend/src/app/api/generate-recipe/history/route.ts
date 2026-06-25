import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/server/auth";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("recipe_requests")
      .select("id, detected_ingredients, final_output, created_at")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) return NextResponse.json({ detail: error.message }, { status: 400 });
    return NextResponse.json(data || []);
  });
}
