import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getSupabaseConfig } from "@/lib/supabase/config"
import { createNoStoreFetch } from "@/lib/supabase/no-store-fetch"

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath) return "/app"
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return "/app"
  if (nextPath === "/") return "/app"
  return nextPath
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"))

  const oauthError = requestUrl.searchParams.get("error")
  const oauthErrorDescription = requestUrl.searchParams.get("error_description")
  if (oauthError) {
    const loginUrl = new URL("/login", requestUrl.origin)
    loginUrl.searchParams.set("next", nextPath)
    loginUrl.searchParams.set("error", oauthErrorDescription || oauthError)
    return NextResponse.redirect(loginUrl)
  }

  const code = requestUrl.searchParams.get("code")
  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin)
    loginUrl.searchParams.set("next", nextPath)
    loginUrl.searchParams.set("error", "missing_oauth_code")
    return NextResponse.redirect(loginUrl)
  }

  const redirectUrl = new URL(nextPath, requestUrl.origin)
  const response = NextResponse.redirect(redirectUrl)
  const { url, anonKey } = getSupabaseConfig()

  const supabase = createServerClient(url, anonKey, {
    global: { fetch: createNoStoreFetch() },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin)
    loginUrl.searchParams.set("next", nextPath)
    loginUrl.searchParams.set("error", error.message)
    return NextResponse.redirect(loginUrl)
  }

  return response
}
