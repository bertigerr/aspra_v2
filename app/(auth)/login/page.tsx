"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type OAuthProvider = "google" | "apple" | "facebook"

const OAUTH_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_OAUTH_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AUTH_OAUTH_ENABLED === "1"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const nextPath = searchParams.get("next")
  const safeNext =
    nextPath && nextPath.startsWith("/") && nextPath !== "/" ? nextPath : "/app"

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

    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (authError) {
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

      {(error || searchParams.get("error")) && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error || searchParams.get("error")}
        </p>
      )}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-white text-zinc-950 hover:bg-white/90"
        disabled={loading}
      >
        {loading ? "Отправляем код..." : "Получить код"}
      </Button>

      {OAUTH_ENABLED && (
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

function LoginFormFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-12 rounded bg-white/10" />
        <div className="h-10 rounded-md bg-white/10" />
      </div>
      <div className="h-11 rounded-xl bg-white/20" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="dark relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_10%,rgba(56,189,248,0.25),transparent_60%),radial-gradient(50%_50%_at_80%_20%,rgba(34,197,94,0.2),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-8 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Aspra</p>
            <h1 className="text-2xl font-semibold">Вход</h1>
            <p className="text-sm text-white/70">Отправим код на почту — пароль не нужен.</p>
          </div>

          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-xs text-white/60">
            Нет аккаунта? Просто введите email — мы создадим.
          </div>
        </div>
      </div>
    </div>
  )
}
