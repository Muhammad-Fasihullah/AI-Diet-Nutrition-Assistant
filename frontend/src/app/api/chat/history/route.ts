import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/server/auth";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("chat_history")
      .select("id, role, message, created_at")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ detail: error.message }, { status: 400 });
    return NextResponse.json(data || []);
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    const supabase = getSupabaseAdmin();
    await supabase.from("chat_history").delete().eq("user_id", user.user_id);
    await supabase.from("user_memory").delete().eq("user_id", user.user_id);
    return NextResponse.json({ message: "Chat history cleared" });
  });
}
