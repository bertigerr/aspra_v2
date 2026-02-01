"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type EmailVerifyType = "email" | "signup"

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath) return "/app"
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return "/app"
  if (nextPath === "/") return "/app"
  return nextPath
}

function getVerifyType(raw: string | null): EmailVerifyType {
  return raw === "signup" ? "signup" : "email"
}

function toFriendlyOtpErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("token") ||
    normalized.includes("otp") ||
    normalized.includes("code")
  ) {
    return "Неверный или истёкший код. Запросите новый и попробуйте ещё раз."
  }

  if (normalized.includes("email")) {
    return "Проверьте email и попробуйте ещё раз."
  }

  return message
}

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = (searchParams.get("email") || "").trim()
  const safeNext = getSafeNextPath(searchParams.get("next"))
  const verifyType = getVerifyType(searchParams.get("type"))

  const changeEmailHref = useMemo(() => {
    const query = new URLSearchParams({ next: safeNext })
    if (email) query.set("email", email)
    return `/login?${query.toString()}`
  }, [email, safeNext])

  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(60)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1))
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [cooldown])

  const sanitizeCode = (value: string) => value.replace(/\D/g, "").slice(0, 6)

  const verify = async (token: string) => {
    if (!email) {
      setError("Не указан email. Вернитесь на страницу входа.")
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: verifyType,
    })

    if (authError) {
      console.error("[auth] auth_otp_verified_error", authError.message)
      setError(toFriendlyOtpErrorMessage(authError.message))
      setSubmitting(false)
      setCode("")
      inputRef.current?.focus()
      return
    }

    console.info("[auth] auth_otp_verified_success")
    router.push(safeNext)
    router.refresh()
  }

  useEffect(() => {
    const token = sanitizeCode(code)
    if (token.length !== 6) return
    if (submitting) return

    void verify(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const resend = async () => {
    if (!email) {
      setError("Не указан email. Вернитесь на страницу входа.")
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    console.info("[auth] auth_otp_resend_clicked")

    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: verifyType === "signup" },
    })

    if (authError) {
      console.error("[auth] auth_otp_resend_error", authError.message)
      setError(authError.message)
      setSubmitting(false)
      return
    }

    setMessage("Код отправлен повторно.")
    setCooldown(60)
    setSubmitting(false)
    inputRef.current?.focus()
  }

  if (!email) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Не указан email. Вернитесь на страницу входа.
        </p>
        <Link
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-medium text-zinc-950 hover:bg-white/90"
          href="/login"
        >
          На вход
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/70" htmlFor="code">
          Код из письма
        </label>
        <Input
          ref={inputRef}
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          className="h-12 border-white/10 bg-white/10 text-center text-lg tracking-[0.35em] text-white placeholder:text-white/40"
          value={code}
          onChange={(event) => {
            setError(null)
            setMessage(null)
            setCode(sanitizeCode(event.target.value))
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text")
            const nextValue = sanitizeCode(pasted)
            if (!nextValue) return
            event.preventDefault()
            setError(null)
            setMessage(null)
            setCode(nextValue)
          }}
          disabled={submitting}
          aria-label="6-digit code"
        />
        <p className="text-xs text-white/50">
          Мы отправили код на <span className="text-white/70">{email}</span>
        </p>
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

      <div className="flex items-center justify-between gap-3 text-xs text-white/60">
        <Link className="text-white hover:text-white/80" href={changeEmailHref}>
          Изменить email
        </Link>

        <Button
          type="button"
          variant="ghost"
          className="h-9 px-3 text-xs text-white hover:bg-white/10 hover:text-white"
          onClick={() => void resend()}
          disabled={submitting || cooldown > 0}
        >
          {cooldown > 0 ? `Отправить ещё раз (${cooldown}s)` : "Отправить ещё раз"}
        </Button>
      </div>
    </div>
  )
}

function VerifyFormFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-12 rounded-md bg-white/10" />
        <div className="h-4 w-48 rounded bg-white/10" />
      </div>
      <div className="h-10 rounded-xl bg-white/10" />
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="dark relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_10%,rgba(56,189,248,0.25),transparent_60%),radial-gradient(50%_50%_at_80%_20%,rgba(34,197,94,0.2),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-8 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Aspra</p>
            <h1 className="text-2xl font-semibold">Подтверждение</h1>
            <p className="text-sm text-white/70">Введите 6-значный код из письма.</p>
          </div>

          <Suspense fallback={<VerifyFormFallback />}>
            <VerifyForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
