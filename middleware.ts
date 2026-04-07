import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Debug logging helper
const DEBUG = process.env.NODE_ENV === "development";
function log(...args: unknown[]) {
  if (DEBUG) {
    console.log("[MIDDLEWARE]", ...args);
  }
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/startup-signup",
  "/investor-signup",
  "/pricing",
  "/about",
  "/select-role",
  "/auth/callback",
];

// Routes that authenticated users should be redirected from
const AUTH_ONLY_ROUTES = ["/login", "/signup", "/startup-signup", "/investor-signup"];

function isPublicRoute(path: string): boolean {
  // Allow static assets from /public (e.g. /logo.png, /robots.txt, etc.)
  if (/\.[^/]+$/.test(path)) {
    log("Static asset route:", path);
    return true;
  }

  // Check exact matches
  if (PUBLIC_ROUTES.includes(path)) {
    log("Public route (exact match):", path);
    return true;
  }
  // Check system routes
  if (path.startsWith("/api/") || path.startsWith("/_next/") || path === "/favicon.ico") {
    log("System route:", path);
    return true;
  }
  log("Protected route:", path);
  return false;
}

function isAuthOnlyRoute(path: string): boolean {
  return AUTH_ONLY_ROUTES.includes(path);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Debug logging for path detection
  console.log("Path:", pathname);

  // Always allow public routes
  if (isPublicRoute(pathname)) {
    log("Allowing public route:", pathname);
    return NextResponse.next();
  }

  // Check for Supabase auth cookies
  const authCookie = request.cookies.get("sb-access-token");
  const refreshCookie = request.cookies.get("sb-refresh-token");

  log("Auth cookies present:", !!(authCookie && refreshCookie));

  // Create a Supabase client to verify the session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // If no auth cookies, redirect to login
  if (!authCookie || !refreshCookie) {
    log("No auth cookies, checking if auth-only route:", pathname);
    if (isAuthOnlyRoute(pathname)) {
      log("Allowing auth-only route without session:", pathname);
      return NextResponse.next();
    }
    log("Redirecting to login (no session):", pathname);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User has cookies, verify the session
  try {
    log("Verifying session...");
    // Set the session from cookies
    await supabase.auth.setSession({
      access_token: authCookie.value,
      refresh_token: refreshCookie.value,
    });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      log("Invalid session, clearing cookies and redirecting");
      // Invalid session, clear cookies and redirect
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      return response;
    }

    log("Valid session for user:", session.user.id);

    // Valid session
    if (isAuthOnlyRoute(pathname)) {
      log("Authenticated user on auth-only route, redirecting to dashboard");
      // Authenticated user trying to access login/signup
      // Redirect to appropriate dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role === "investor") {
        log("Redirecting investor to /investor/dashboard");
        return NextResponse.redirect(new URL("/investor/dashboard", request.url));
      } else {
        log("Redirecting startup to /dashboard");
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // User is authenticated and accessing protected route - allow
    log("Allowing protected route for authenticated user:", pathname);
    return NextResponse.next();
  } catch (err) {
    log("Error verifying session:", err);
    // Error verifying session, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    return response;
  }
}

export const config = {
  matcher: [
    // Match application routes only; skip api, next internals, and static files.
    "/((?!api|_next|.*\\..*).*)",
  ],
}
