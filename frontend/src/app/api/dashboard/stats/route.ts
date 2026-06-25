import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/server/auth";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const supabase = getSupabaseAdmin();
    const uid = user.user_id;

    const [profileRes, chatsRes, analysesRes, recipesRes, recentRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", uid).single(),
        supabase
          .from("chat_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("image_analysis")
          .select("*", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("recipe_requests")
          .select("*", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("chat_history")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    if (!profileRes.data) {
      return NextResponse.json({ detail: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: profileRes.data,
      total_chats: chatsRes.count || 0,
      total_analyses: analysesRes.count || 0,
      total_recipes: recipesRes.count || 0,
      recent_chats: recentRes.data || [],
    });
  });
}
