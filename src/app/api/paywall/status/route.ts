import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { COOKIE_NAME, verifyPaidSessionToken } from "@/lib/paywall-session";

export async function GET() {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ paid: false }, { status: 200 });
    }

    const payload = verifyPaidSessionToken(token);
    return NextResponse.json({ paid: Boolean(payload), payload }, { status: 200 });
  } catch (e) {
    // If secret misconfigured, treat as not paid.
    return NextResponse.json({ paid: false }, { status: 200 });
  }
}

