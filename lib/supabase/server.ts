import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabaseConfig } from "./config"

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  const { url, anonKey } = getSupabaseConfig()

  return createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // The cookies API throws in Server Components; ignore and rely on middleware/route handlers.
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {
          // The cookies API throws in Server Components; ignore and rely on middleware/route handlers.
        }
      },
    },
  })
}
