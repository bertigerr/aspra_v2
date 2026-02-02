import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware"

const PUBLIC_PATHS = ["/login", "/login/verify", "/register", "/auth/callback"]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    const nextPath = `${pathname}${search}`
    redirectUrl.searchParams.set("next", nextPath)
    return NextResponse.redirect(redirectUrl)
  }

  // Allow OAuth callback to run even for authenticated users.
  if (pathname === "/auth/callback" || pathname.startsWith("/auth/callback/")) {
    return response
  }

  if (user && isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/app"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("[proxy] profiles_fetch_error", profileError.code || profileError.message)
      return response
    }

    const isOnboarded = Boolean(profile?.onboarding_completed_at)
    const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/")

    if (!isOnboarded && !isOnboardingRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/onboarding"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }

    if (isOnboarded && isOnboardingRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/app"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
