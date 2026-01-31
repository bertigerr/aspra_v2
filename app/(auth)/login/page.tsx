"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    const nextPath = searchParams.get("next")
    const safeNext =
      nextPath && nextPath.startsWith("/") && nextPath !== "/" ? nextPath : "/app"

    const query = new URLSearchParams({ email, next: safeNext })
    router.push(`/login/verify?${query.toString()}`)
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

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-white text-zinc-950 hover:bg-white/90"
        disabled={loading}
      >
        {loading ? "Отправляем код..." : "Получить код"}
      </Button>
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

          <div className="mt-6 flex items-center justify-between text-xs text-white/60">
            <span>Нет аккаунта?</span>
            <Link className="text-white hover:text-white/80" href="/register">
              Создать
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
