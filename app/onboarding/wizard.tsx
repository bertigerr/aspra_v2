"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LANGUAGE_LEVELS,
  SUPPORTED_ACTIVE_LANGS,
  SUPPORTED_NATIVE_LANGS,
  type ActiveLang,
  type LanguageLevel,
  type NativeLang,
  isActiveLang,
  isLanguageLevel,
  isNativeLang,
} from "@/lib/languages";
import {
  completeOnboarding,
  saveOnboardingActiveLang,
  saveOnboardingNativeLang,
} from "@/app/actions";

type Step = 1 | 2 | 3;

function guessDefaultNativeLang(): NativeLang {
  if (typeof navigator === "undefined") return "en";
  const code = navigator.language.toLowerCase().split("-")[0];
  if (isNativeLang(code)) return code;
  return "en";
}

export function OnboardingWizard({
  initialNativeLang,
  initialActiveLang,
}: {
  initialNativeLang: string | null;
  initialActiveLang: string | null;
}) {
  const router = useRouter();

  const initialStep: Step = useMemo(() => {
    if (!initialNativeLang) return 1;
    if (!initialActiveLang) return 2;
    return 3;
  }, [initialActiveLang, initialNativeLang]);

  const [step, setStep] = useState<Step>(initialStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nativeLang, setNativeLang] = useState<string>(initialNativeLang || "en");
  const [activeLang, setActiveLang] = useState<string>(initialActiveLang || "");
  const [level, setLevel] = useState<string>("");

  useEffect(() => {
    if (initialNativeLang) return;
    setNativeLang(guessDefaultNativeLang());
  }, [initialNativeLang]);

  const canNext =
    (step === 1 && nativeLang.trim().length > 0) ||
    (step === 2 && isActiveLang(activeLang)) ||
    (step === 3 && isLanguageLevel(level));

  const handleBack = () => {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleNext = async () => {
    setError(null);

    if (step === 1) {
      const native = nativeLang.trim();
      if (!native) {
        setError("Выберите родной язык.");
        return;
      }

      setSaving(true);
      try {
        await saveOnboardingNativeLang(native);
        setStep(2);
      } catch (e) {
        console.error(e);
        setError("Не удалось сохранить. Проверь сеть и попробуй снова.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 2) {
      if (!isActiveLang(activeLang)) {
        setError("Выберите изучаемый язык.");
        return;
      }

      setSaving(true);
      try {
        await saveOnboardingActiveLang(activeLang as ActiveLang);
        setStep(3);
      } catch (e) {
        console.error(e);
        setError("Не удалось сохранить. Проверь сеть и попробуй снова.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step !== 3) return;

    const native = nativeLang.trim();
    if (!native) {
      setError("Выберите родной язык.");
      return;
    }

    if (!isActiveLang(activeLang)) {
      setError("Выберите изучаемый язык.");
      return;
    }

    if (!isLanguageLevel(level)) {
      setError("Выберите уровень.");
      return;
    }

    setSaving(true);
    try {
      await completeOnboarding(native, activeLang as ActiveLang, level as LanguageLevel);
      router.push("/app");
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("Не удалось завершить онбординг. Проверь сеть и попробуй снова.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-white/60">Шаг {step} из 3</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Твой родной язык</h1>
              <p className="text-sm text-white/60">
                Мы будем использовать его для переводов и подсказок.
              </p>

              <div className="space-y-2">
                <label htmlFor="native_lang" className="text-xs font-medium text-white/70">
                  Родной язык
                </label>
                <select
                  id="native_lang"
                  name="native_lang"
                  value={nativeLang}
                  onChange={(e) => setNativeLang(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {SUPPORTED_NATIVE_LANGS.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-zinc-900">
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Какой язык учишь сейчас?</h1>
              <p className="text-sm text-white/60">
                Потом сможешь добавить другие языки через кнопку флага.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {SUPPORTED_ACTIVE_LANGS.map((lang) => {
                  const selected = activeLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setActiveLang(lang.code)}
                      className={[
                        "rounded-2xl border p-4 text-left transition",
                        selected
                          ? "border-emerald-400/60 bg-emerald-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="text-2xl">{lang.flag}</div>
                      <div className="mt-2 font-medium">{lang.label}</div>
                      <div className="text-xs text-white/50">{lang.code}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">
                Твой уровень в{" "}
                {SUPPORTED_ACTIVE_LANGS.find((l) => l.code === activeLang)?.label || "языке"}
              </h1>
              <p className="text-sm text-white/60">
                Это помогает подобрать примеры и сложность.
              </p>

              <div className="space-y-3">
                {LANGUAGE_LEVELS.map((opt) => {
                  const selected = level === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setLevel(opt.code)}
                      className={[
                        "w-full rounded-2xl border p-4 text-left transition",
                        selected
                          ? "border-emerald-400/60 bg-emerald-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="mt-1 text-xs text-white/60">{opt.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={handleBack}
            disabled={saving || step === 1}
          >
            Назад
          </Button>
          <Button
            type="button"
            className="flex-1 bg-white text-zinc-950 hover:bg-white/90"
            onClick={handleNext}
            disabled={saving || !canNext}
          >
            {step === 3 ? (saving ? "Сохраняем..." : "Завершить") : "Далее"}
          </Button>
        </div>
      </div>
    </div>
  );
}
