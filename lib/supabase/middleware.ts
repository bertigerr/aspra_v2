import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getSupabaseConfig } from "./config"

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const response = NextResponse.next({ request })
  const { url, anonKey } = getSupabaseConfig()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        response.cookies.set({ name, value, ...options })
      },
      remove(name, options) {
        response.cookies.set({ name, value: "", ...options })
      },
    },
  })

  return { supabase, response }
}
