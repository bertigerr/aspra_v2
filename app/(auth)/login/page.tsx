import { Suspense } from "react"

import { LoginForm } from "./login-form"

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
  const oauthEnabled =
    process.env.AUTH_OAUTH_ENABLED === "true" ||
    process.env.AUTH_OAUTH_ENABLED === "1" ||
    process.env.NEXT_PUBLIC_AUTH_OAUTH_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_AUTH_OAUTH_ENABLED === "1"

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
            <LoginForm oauthEnabled={oauthEnabled} />
          </Suspense>

          <div className="mt-6 text-xs text-white/60">
            Нет аккаунта? Просто введите email — мы создадим.
          </div>
        </div>
      </div>
    </div>
  )
}

