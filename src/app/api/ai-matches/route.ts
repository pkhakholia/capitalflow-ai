import { NextResponse } from "next/server";

// Deprecated route kept for backward compatibility.

export async function POST(req: Request) {
  try {
    return NextResponse.json(
      {
        error:
          "This endpoint is deprecated. Matching now uses embeddings stored in Supabase and does not call external AI APIs during matching."
      },
      { status: 410 }
    );
  } catch (e) {
    console.error("ai-matches route error:", e);
    const errObj =
      e instanceof Error
        ? {
            name: e.name,
            message: e.message,
            stack: e.stack
          }
        : { message: "Failed to compute AI matches." };
    return NextResponse.json(
      { error: errObj },
      { status: 500 }
    );
  }
}

