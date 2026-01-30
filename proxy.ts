import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware"

const PUBLIC_PATHS = ["/login", "/register"]

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

  if (user && isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
