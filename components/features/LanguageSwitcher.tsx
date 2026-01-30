"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  LANGUAGE_LEVELS,
  SUPPORTED_ACTIVE_LANGS,
  getLangFlag,
  getLangLabel,
  isActiveLang,
  isLanguageLevel,
  type ActiveLang,
  type LanguageLevel,
} from "@/lib/languages";
import { cn } from "@/lib/utils";
import { enableLanguage, getLanguageState, setActiveLang } from "@/app/actions";

type LanguageState = Awaited<ReturnType<typeof getLanguageState>>;

export function LanguageSwitcher() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<LanguageState | null>(null);
  const [switching, setSwitching] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addLang, setAddLang] = useState<string>("");
  const [addLevel, setAddLevel] = useState<string>("");
  const [adding, setAdding] = useState(false);

  const enabledLangCodes = useMemo(() => {
    return new Set((state?.languages || []).map((l) => l.lang_code));
  }, [state?.languages]);

  const availableToAdd = useMemo(() => {
    return SUPPORTED_ACTIVE_LANGS.filter((l) => !enabledLangCodes.has(l.code));
  }, [enabledLangCodes]);

  const activeFlag = state?.active_lang ? getLangFlag(state.active_lang) : "🏳️";

  const reload = async () => {
    setLoading(true);
    try {
      const data = await getLanguageState();
      setState(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load languages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleSwitch = async (langCode: ActiveLang) => {
    if (!state) return;
    if (state.active_lang === langCode) return;
    setSwitching(true);
    try {
      await setActiveLang(langCode);
      await reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch language");
    } finally {
      setSwitching(false);
    }
  };

  const handleAdd = async () => {
    if (!isActiveLang(addLang) || !isLanguageLevel(addLevel)) return;
    setAdding(true);
    try {
      await enableLanguage(addLang as ActiveLang, addLevel as LanguageLevel);
      setAddOpen(false);
      setAddLang("");
      setAddLevel("");
      await reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add language");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="absolute left-4 top-4 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur",
              "hover:bg-white/10 active:scale-95 transition"
            )}
            aria-label="Active language"
            disabled={loading || switching}
          >
            <span className="text-xl leading-none">{activeFlag}</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56 border-white/10 bg-zinc-950/95 text-white">
          <DropdownMenuLabel>Languages</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />

          {(state?.languages || []).map((lang) => {
            const code = String(lang.lang_code);
            const isCurrent = state?.active_lang === code;
            return (
              <DropdownMenuItem
                key={code}
                onSelect={() => {
                  if (isActiveLang(code)) void handleSwitch(code);
                }}
                className={cn(
                  "cursor-pointer",
                  isCurrent && "bg-white/10"
                )}
              >
                <span className="text-lg">{getLangFlag(code)}</span>
                <span className="flex-1">{getLangLabel(code)}</span>
                {isCurrent && <span className="text-xs text-white/60">Active</span>}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuLabel className="text-white/60">Other languages</DropdownMenuLabel>
          {availableToAdd.length === 0 ? (
            <DropdownMenuItem disabled className="opacity-60">
              All languages enabled
            </DropdownMenuItem>
          ) : (
            availableToAdd.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                className="cursor-pointer"
                onSelect={() => {
                  setAddLang(lang.code);
                  setAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.label}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Drawer
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setAddLang("");
            setAddLevel("");
          }
        }}
      >
        <DrawerContent className="border-white/10 bg-zinc-950 text-white">
          <DrawerHeader>
            <DrawerTitle>Add language</DrawerTitle>
          </DrawerHeader>

          <div className="space-y-6 px-4 pb-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Language</p>
              <div className="grid grid-cols-2 gap-2">
                {availableToAdd.map((lang) => {
                  const selected = addLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setAddLang(lang.code)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left",
                        selected
                          ? "border-emerald-400/60 bg-emerald-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Level</p>
              <div className="grid grid-cols-1 gap-2">
                {LANGUAGE_LEVELS.map((lvl) => {
                  const selected = addLevel === lvl.code;
                  return (
                    <button
                      key={lvl.code}
                      type="button"
                      onClick={() => setAddLevel(lvl.code)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left",
                        selected
                          ? "border-emerald-400/60 bg-emerald-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="text-sm font-medium">{lvl.label}</div>
                      <div className="text-xs text-white/60">{lvl.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DrawerFooter>
            <div className="flex gap-3">
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  disabled={adding}
                >
                  Отмена
                </Button>
              </DrawerClose>
              <Button
                type="button"
                className="flex-1 bg-white text-zinc-950 hover:bg-white/90"
                disabled={!isActiveLang(addLang) || !isLanguageLevel(addLevel) || adding}
                onClick={handleAdd}
              >
                {adding ? "Добавляем..." : "Добавить"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
