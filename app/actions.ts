"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createEmptyCard, fsrs, State, type Card, type Grade } from "ts-fsrs";
import {
    getLangLabel,
    isActiveLang,
    isLanguageLevel,
    type ActiveLang,
    type LanguageLevel,
} from "@/lib/languages";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface Example {
    original: string;
    translated: string;
}

export interface AIAnalysisResult {
    text: string;
    translation: string;
    definition: string;
    examples: Example[];
}

async function requireUser() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    return { supabase, user };
}

async function getProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("native_lang, active_lang, onboarding_completed_at")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        if (error.code === "PGRST204") {
            throw new Error(
                "Supabase schema cache is out of date. Apply the latest migrations in `supabase/migrations` and reload the schema cache (Dashboard → Settings → API → Restart)."
            );
        }
        throw new Error("Failed to fetch profile");
    }

    return data;
}

async function requireActiveLang(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    userId: string
): Promise<ActiveLang> {
    const profile = await getProfile(supabase, userId);
    const activeLang = profile?.active_lang;

    if (!activeLang || !isActiveLang(activeLang)) {
        throw new Error("Active language is not set");
    }

    return activeLang;
}

async function getOrCreateDefaultDictionaryId(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    userId: string,
    langCode: ActiveLang
): Promise<string> {
    const { data: existing, error: existingError } = await supabase
        .from("dictionaries")
        .select("id")
        .eq("user_id", userId)
        .eq("lang_code", langCode)
        .eq("is_default", true)
        .maybeSingle();

    if (existingError) {
        throw new Error("Failed to fetch dictionary");
    }

    if (existing?.id) {
        return existing.id;
    }

    const { data: created, error: createError } = await supabase
        .from("dictionaries")
        .insert({
            user_id: userId,
            lang_code: langCode,
            name: getLangLabel(langCode),
            is_default: true,
        })
        .select("id")
        .single();

    if (!createError) {
        return created.id;
    }

    // In case of race condition, try selecting again
    const { data: retry, error: retryError } = await supabase
        .from("dictionaries")
        .select("id")
        .eq("user_id", userId)
        .eq("lang_code", langCode)
        .eq("is_default", true)
        .maybeSingle();

    if (retryError || !retry?.id) {
        throw new Error("Failed to create dictionary");
    }

    return retry.id;
}

export async function analyzeWord(
    query: string,
    nativeLang?: string,
    targetLang?: string
): Promise<AIAnalysisResult> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        throw new Error("Query is required");
    }

    let resolvedNativeLang = nativeLang;
    let resolvedTargetLang = targetLang;

    try {
        const { supabase, user } = await requireUser();
        const profile = await getProfile(supabase, user.id);

        resolvedNativeLang ||= profile?.native_lang || "en";
        resolvedTargetLang ||= (isActiveLang(profile?.active_lang || "") ? profile?.active_lang : null) || "en";
    } catch {
        // Allow running without auth context (e.g. public pages/dev)
        resolvedNativeLang ||= "en";
        resolvedTargetLang ||= "en";
    }

    const prompt = `
    Analyze the word or phrase "${trimmedQuery}".
    Target Language: ${resolvedTargetLang} (the language of the word).
    Native Language: ${resolvedNativeLang} (for translation).

    Return ONLY a JSON object with the following structure (no markdown, no extra text):
    {
      "text": "Correct spelling of the word/phrase",
      "translation": "Concise translation in Native Language (1-2 words)",
      "definition": "Simple definition in Target Language",
      "examples": [
        { "original": "Example sentence in Target Language", "translated": "Translation in Native Language" }
      ]
    }
    
    Provide exactly 2 examples.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini Response:", text);

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");

        const data = JSON.parse(cleanText) as AIAnalysisResult;
        return data;
    } catch (error) {
        console.error("Gemini Analysis Error:", JSON.stringify(error, null, 2));
        throw new Error("Failed to analyze word. Check server logs for details.");
    }
}

export async function saveWord(word: AIAnalysisResult) {
    const { supabase, user } = await requireUser();
    const activeLang = await requireActiveLang(supabase, user.id);
    const dictionaryId = await getOrCreateDefaultDictionaryId(supabase, user.id, activeLang);

    // Initialize new FSRS card
    const card: Card = createEmptyCard();

    // Prepare data for DB
    const wordData = {
        user_id: user.id,
        lang_code: activeLang,
        dictionary_id: dictionaryId,
        text: word.text,
        translation: word.translation,
        definition: word.definition,
        examples: word.examples, // Storing array as JSON
        // FSRS fields
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        reps: card.reps,
        state: card.state,
        due_date: card.due.toISOString(), // Convert Date to TIMESTAMPTZ string
    };

    const { error } = await supabase.from("words").insert(wordData);

    if (error) {
        console.error("Save Error:", JSON.stringify(error, null, 2));
        throw new Error("Failed to save word");
    }

    return { success: true };
}

export async function getWords() {
    const { supabase, user } = await requireUser();
    const activeLang = await requireActiveLang(supabase, user.id);

    const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("user_id", user.id)
        .eq("lang_code", activeLang)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch Words Error:", error);
        return [];
    }

    return data || [];
}

export async function updateProfile(formData: FormData) {
    const { supabase, user } = await requireUser();

    const native_lang = String(formData.get("native_lang") ?? "").trim();

    if (!native_lang) {
        throw new Error("Native language is required");
    }

    const { error } = await supabase.from("profiles").upsert(
        {
            id: user.id,
            native_lang,
        },
        { onConflict: "id" }
    );

    if (error) {
        console.error("Update Profile Error:", error);
        throw new Error("Failed to update profile");
    }

    return { success: true };
}

export async function getWord(id: string) {
    const { supabase, user } = await requireUser();
    const activeLang = await requireActiveLang(supabase, user.id);
    const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("lang_code", activeLang)
        .single();

    if (error) {
        return null;
    }
    return data;
}

export async function updateWord(id: string, formData: FormData) {
    const { supabase, user } = await requireUser();
    const activeLang = await requireActiveLang(supabase, user.id);

    const text = String(formData.get("text") ?? "").trim();
    const translationInput = String(formData.get("translation") ?? "").trim();
    const definitionInput = String(formData.get("definition") ?? "").trim();

    if (!text) {
        throw new Error("Text is required");
    }

    const translation = translationInput === "" ? null : translationInput;
    const definition = definitionInput === "" ? null : definitionInput;

    const { error } = await supabase
        .from("words")
        .update({ text, translation, definition })
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("lang_code", activeLang);

    if (error) {
        throw new Error("Failed to update word");
    }

    return { success: true };
}

export async function deleteWord(id: string) {
    const { supabase, user } = await requireUser();
    const activeLang = await requireActiveLang(supabase, user.id);
    const { error } = await supabase
        .from("words")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("lang_code", activeLang);

    if (error) {
        throw new Error("Failed to delete word");
    }

    return { success: true };
}

export async function completeOnboarding(
    nativeLang: string,
    activeLang: ActiveLang,
    level: LanguageLevel
) {
    const { supabase, user } = await requireUser();

    const trimmedNative = nativeLang.trim();
    if (!trimmedNative) {
        throw new Error("Native language is required");
    }

    if (!isActiveLang(activeLang)) {
        throw new Error("Invalid active language");
    }

    if (!isLanguageLevel(level)) {
        throw new Error("Invalid language level");
    }

    const now = new Date().toISOString();

    // Save step fields (idempotent) but don't mark onboarding complete until everything succeeds.
    const { error: upsertProfileError } = await supabase.from("profiles").upsert(
        {
            id: user.id,
            native_lang: trimmedNative,
            active_lang: activeLang,
        },
        { onConflict: "id" }
    );

    if (upsertProfileError) {
        console.error("Onboarding profile upsert error:", upsertProfileError);
        if (upsertProfileError.code === "PGRST204") {
            throw new Error(
                "Supabase schema cache is out of date. Apply the latest migrations in `supabase/migrations` and reload the schema cache (Dashboard → Settings → API → Restart)."
            );
        }
        throw new Error("Failed to save onboarding");
    }

    const { error: insertUserLangError } = await supabase.from("user_languages").insert({
        user_id: user.id,
        lang_code: activeLang,
        level,
        enabled_at: now,
        last_active_at: now,
    });

    if (insertUserLangError) {
        const { error: updateUserLangError } = await supabase
            .from("user_languages")
            .update({ level, last_active_at: now })
            .eq("user_id", user.id)
            .eq("lang_code", activeLang);

        if (updateUserLangError) {
            console.error("Onboarding user_languages error:", insertUserLangError, updateUserLangError);
            throw new Error("Failed to save onboarding");
        }
    }

    await getOrCreateDefaultDictionaryId(supabase, user.id, activeLang);

    const { error: completeError } = await supabase
        .from("profiles")
        .update({ onboarding_completed_at: now })
        .eq("id", user.id);

    if (completeError) {
        console.error("Onboarding completion error:", completeError);
        throw new Error("Failed to complete onboarding");
    }

    console.info("onboarding_completed", { native_lang: trimmedNative, active_lang: activeLang, level });

    return { success: true };
}

export async function saveOnboardingNativeLang(nativeLang: string) {
    const { supabase, user } = await requireUser();
    const trimmedNative = nativeLang.trim();

    if (!trimmedNative) {
        throw new Error("Native language is required");
    }

    const { error } = await supabase.from("profiles").upsert(
        {
            id: user.id,
            native_lang: trimmedNative,
        },
        { onConflict: "id" }
    );

    if (error) {
        console.error("Onboarding native_lang save error:", error);
        if (error.code === "PGRST204") {
            throw new Error(
                "Supabase schema cache is out of date. Apply the latest migrations in `supabase/migrations` and reload the schema cache (Dashboard → Settings → API → Restart)."
            );
        }
        throw new Error("Failed to save onboarding");
    }

    return { success: true };
}

export async function saveOnboardingActiveLang(activeLang: ActiveLang) {
    const { supabase, user } = await requireUser();

    if (!isActiveLang(activeLang)) {
        throw new Error("Invalid active language");
    }

    const { error } = await supabase.from("profiles").upsert(
        {
            id: user.id,
            active_lang: activeLang,
        },
        { onConflict: "id" }
    );

    if (error) {
        console.error("Onboarding active_lang save error:", error);
        if (error.code === "PGRST204") {
            throw new Error(
                "Supabase schema cache is out of date. Apply the latest migrations in `supabase/migrations` and reload the schema cache (Dashboard → Settings → API → Restart)."
            );
        }
        throw new Error("Failed to save onboarding");
    }

    return { success: true };
}

export async function getLanguageState() {
    const { supabase, user } = await requireUser();

    const profile = await getProfile(supabase, user.id);
    const activeLang = profile?.active_lang && isActiveLang(profile.active_lang) ? profile.active_lang : null;

    const { data: languages, error } = await supabase
        .from("user_languages")
        .select("lang_code, level, last_active_at")
        .eq("user_id", user.id)
        .order("last_active_at", { ascending: false });

    if (error) {
        throw new Error("Failed to fetch languages");
    }

    return {
        active_lang: activeLang,
        languages: languages || [],
    };
}

export async function setActiveLang(langCode: ActiveLang) {
    const { supabase, user } = await requireUser();

    if (!isActiveLang(langCode)) {
        throw new Error("Invalid language");
    }

    const now = new Date().toISOString();

    const { data: enabled, error: enabledError } = await supabase
        .from("user_languages")
        .select("lang_code")
        .eq("user_id", user.id)
        .eq("lang_code", langCode)
        .maybeSingle();

    if (enabledError || !enabled) {
        throw new Error("Language is not enabled");
    }

    const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ active_lang: langCode })
        .eq("id", user.id);

    if (updateProfileError) {
        throw new Error("Failed to switch language");
    }

    await supabase
        .from("user_languages")
        .update({ last_active_at: now })
        .eq("user_id", user.id)
        .eq("lang_code", langCode);

    console.info("active_lang_changed", { to: langCode });

    return { success: true };
}

export async function enableLanguage(langCode: ActiveLang, level: LanguageLevel) {
    const { supabase, user } = await requireUser();

    if (!isActiveLang(langCode)) {
        throw new Error("Invalid language");
    }

    if (!isLanguageLevel(level)) {
        throw new Error("Invalid level");
    }

    const now = new Date().toISOString();

    const { error: insertError } = await supabase.from("user_languages").insert({
        user_id: user.id,
        lang_code: langCode,
        level,
        enabled_at: now,
        last_active_at: now,
    });

    if (insertError) {
        const { error: updateError } = await supabase
            .from("user_languages")
            .update({ level, last_active_at: now })
            .eq("user_id", user.id)
            .eq("lang_code", langCode);

        if (updateError) {
            console.error("Enable language error:", insertError, updateError);
            throw new Error("Failed to enable language");
        }
    }

    await getOrCreateDefaultDictionaryId(supabase, user.id, langCode);

    const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ active_lang: langCode })
        .eq("id", user.id);

    if (updateProfileError) {
        throw new Error("Failed to enable language");
    }

    console.info("language_enabled", { lang_code: langCode, level });

    return { success: true };
}

// === Training Actions ===

export interface DueWord {
    id: string;
    text: string;
    translation: string | null;
    definition: string | null;
    examples: Example[];
    state: number;
    due_date: string;
    stability: number | null;
    difficulty: number | null;
    elapsed_days: number;
    reps: number;
    last_review: string | null;
}

export async function getDueWords(): Promise<DueWord[]> {
    const { supabase, user } = await requireUser();
    const activeLang = await requireActiveLang(supabase, user.id);

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("words")
        .select("id, text, translation, definition, examples, state, due_date, stability, difficulty, elapsed_days, reps, last_review")
        .eq("user_id", user.id)
        .eq("lang_code", activeLang)
        .lte("due_date", now)
        .order("due_date", { ascending: true });

    if (error) {
        console.error("getDueWords error:", error);
        throw new Error("Failed to fetch due words");
    }

    return (data || []) as DueWord[];
}

export async function submitReview(wordId: string, rating: number) {
    const { supabase, user } = await requireUser();
    const activeLang = await requireActiveLang(supabase, user.id);

    // Validate rating
    if (rating < 1 || rating > 4) {
        throw new Error("Invalid rating");
    }

    // Fetch current word
    const { data: word, error: fetchError } = await supabase
        .from("words")
        .select("id, state, due_date, stability, difficulty, elapsed_days, reps, last_review")
        .eq("id", wordId)
        .eq("user_id", user.id)
        .eq("lang_code", activeLang)
        .single();

    if (fetchError || !word) {
        throw new Error("Word not found");
    }

    // Convert DB record to FSRS Card
    const now = new Date();
    const card: Card = {
        state: word.state as State,
        due: new Date(word.due_date),
        stability: word.stability ?? 0,
        difficulty: word.difficulty ?? 0,
        elapsed_days: word.elapsed_days,
        scheduled_days: 0,
        reps: word.reps,
        lapses: 0,
        last_review: word.last_review ? new Date(word.last_review) : undefined,
        learning_steps: 0,
    };

    // Calculate new scheduling using FSRS
    const f = fsrs();
    const scheduling = f.repeat(card, now);
    const nextCard = scheduling[rating as Grade].card;

    // Calculate scheduled_days for the review log
    const scheduledDays = Math.round((nextCard.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Update word in DB
    const { error: updateError } = await supabase
        .from("words")
        .update({
            state: nextCard.state,
            due_date: nextCard.due.toISOString(),
            stability: nextCard.stability,
            difficulty: nextCard.difficulty,
            elapsed_days: nextCard.elapsed_days,
            reps: nextCard.reps,
            last_review: now.toISOString(),
        })
        .eq("id", wordId)
        .eq("user_id", user.id);

    if (updateError) {
        console.error("submitReview update error:", updateError);
        throw new Error("Failed to update word");
    }

    // Insert review log
    const { error: reviewError } = await supabase.from("reviews").insert({
        word_id: wordId,
        rating,
        review_time: now.toISOString(),
        scheduled_days: scheduledDays,
    });

    if (reviewError) {
        console.error("submitReview review log error:", reviewError);
        // Non-critical, don't throw
    }

    return { success: true, nextDue: nextCard.due.toISOString() };
}
