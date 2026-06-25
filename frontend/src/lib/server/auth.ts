import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";

export interface AuthUser {
  user_id: string;
  email: string;
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header", 401);
  }

  const token = authHeader.substring(7);
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthError("Invalid or expired token", 401);
    }

    return {
      user_id: data.user.id,
      email: data.user.email || "",
    };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Could not validate credentials", 401);
  }
}

export class AuthError extends Error {
  constructor(public message: string, public status: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (user: AuthUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser(request);
    return await handler(user, request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }
    console.error("API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
