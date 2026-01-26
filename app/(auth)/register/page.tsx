"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") || "").trim()
    const password = String(formData.get("password") || "")

    if (!email || !password) {
      setError("Введите email и пароль.")
      setLoading(false)
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push("/")
      router.refresh()
      return
    }

    setMessage("Проверьте почту для подтверждения регистрации.")
    setLoading(false)
  }

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_10%,rgba(56,189,248,0.25),transparent_60%),radial-gradient(50%_50%_at_80%_20%,rgba(244,114,182,0.2),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-8 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Aspra</p>
            <h1 className="text-2xl font-semibold">Регистрация</h1>
            <p className="text-sm text-white/70">Создай аккаунт и начни собирать словарь.</p>
          </div>

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
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70" htmlFor="password">
                Пароль
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Минимум 6 символов"
                className="border-white/10 bg-white/10 text-white placeholder:text-white/40"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                {message}
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-white text-zinc-950 hover:bg-white/90"
              disabled={loading}
            >
              {loading ? "Создаём..." : "Создать аккаунт"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-white/60">
            <span>Уже есть аккаунт?</span>
            <Link className="text-white hover:text-white/80" href="/login">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
