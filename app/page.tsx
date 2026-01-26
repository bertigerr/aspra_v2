import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_10%_0%,rgba(34,197,94,0.18),transparent_60%),radial-gradient(50%_50%_at_90%_20%,rgba(59,130,246,0.2),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Aspra</p>
            <h1 className="text-3xl font-semibold">Словарь готов к работе</h1>
            <p className="mt-2 text-sm text-white/70">Пользователь: {user.email ?? user.id}</p>
          </div>
          <SignOutButton />
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold">Добавить слово</h2>
            <p className="mt-2 text-sm text-white/70">
              Скоро здесь появится быстрый поиск и генерация переводов.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold">Тренировка</h2>
            <p className="mt-2 text-sm text-white/70">
              Следующий шаг — карточки и кнопки оценки повторений.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
