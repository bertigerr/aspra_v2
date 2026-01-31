"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type OAuthProvider = "google" | "apple" | "facebook"

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath) return "/app"
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return "/app"
  if (nextPath === "/") return "/app"
  return nextPath
}

export function LoginForm({ oauthEnabled }: { oauthEnabled: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const safeNext = getSafeNextPath(searchParams.get("next"))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") || "").trim()

    if (!email) {
      setError("Введите email.")
      setLoading(false)
      return
    }

    console.info("[auth] auth_otp_requested")

    const supabase = createSupabaseBrowserClient()
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo },
    })

    if (authError) {
      console.error("[auth] auth_otp_requested_error", authError.message)
      setError(authError.message)
      setLoading(false)
      return
    }

    const query = new URLSearchParams({ email, next: safeNext })
    router.push(`/login/verify?${query.toString()}`)
  }

  const handleOAuth = async (provider: OAuthProvider) => {
    setOauthLoadingProvider(provider)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    if (authError) {
      setError(authError.message)
      setOauthLoadingProvider(null)
    }
  }

  const urlError = searchParams.get("error")
  const visibleError = error || urlError

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/70" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="border-white/10 bg-white/10 text-white placeholder:text-white/40"
          defaultValue={searchParams.get("email") || ""}
          required
        />
      </div>

      {visibleError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {visibleError}
        </p>
      )}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-white text-zinc-950 hover:bg-white/90"
        disabled={loading || oauthLoadingProvider !== null}
      >
        {loading ? "Отправляем код..." : "Получить код"}
      </Button>

      {oauthEnabled && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">или</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              disabled={loading || oauthLoadingProvider !== null}
              onClick={() => void handleOAuth("google")}
            >
              {oauthLoadingProvider === "google" ? "Открываем Google..." : "Продолжить с Google"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              disabled={loading || oauthLoadingProvider !== null}
              onClick={() => void handleOAuth("apple")}
            >
              {oauthLoadingProvider === "apple" ? "Открываем Apple..." : "Продолжить с Apple"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              disabled={loading || oauthLoadingProvider !== null}
              onClick={() => void handleOAuth("facebook")}
            >
              {oauthLoadingProvider === "facebook"
                ? "Открываем Facebook..."
                : "Продолжить с Facebook"}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
