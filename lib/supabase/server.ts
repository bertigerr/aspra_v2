import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabaseConfig } from "./config"
import { createNoStoreFetch } from "./no-store-fetch"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseConfig()

  return createServerClient(url, anonKey, {
    global: { fetch: createNoStoreFetch() },
    cookies: {
      async getAll() {
        return cookieStore.getAll()
      },
      async setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The cookies API throws in Server Components; ignore and rely on middleware/route handlers.
        }
      },
    },
  })
}
