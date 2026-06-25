import { NextResponse } from "next/server";

export class APIError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
    this.name = "APIError";
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json({ detail: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  console.error("API error:", error);
  return NextResponse.json({ detail: message }, { status: 500 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ detail: message }, { status: 400 });
}

export function notFound(message: string = "Not found"): NextResponse {
  return NextResponse.json({ detail: message }, { status: 404 });
}