"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

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

export async function analyzeWord(
    query: string,
    nativeLang: string = "ru",
    targetLang: string = "en"
): Promise<AIAnalysisResult> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const prompt = `
    Analyze the word or phrase "${query}".
    Target Language: ${targetLang} (the language of the word).
    Native Language: ${nativeLang} (for translation).

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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createEmptyCard, Card } from "ts-fsrs";

// ... previous interfaces ...

export async function saveWord(word: AIAnalysisResult) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Initialize new FSRS card
    const card: Card = createEmptyCard();

    // Prepare data for DB
    const wordData = {
        user_id: user.id,
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
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch Words Error:", error);
        return [];
    }

    return data || [];
}

export async function updateProfile(formData: FormData) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const native_language = String(formData.get("native_language") ?? "").trim();

    // Simple validation
    if (!["ru", "en", "es", "de"].includes(native_language)) {
        throw new Error("Invalid language");
    }

    const { error } = await supabase
        .from("profiles")
        .update({ native_language })
        .eq("id", user.id);

    if (error) {
        console.error("Update Profile Error:", error);
        throw new Error("Failed to update profile");
    }

    return { success: true };
}

export async function getWord(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return null;
    }
    return data;
}

export async function updateWord(id: string, formData: FormData) {
    const supabase = await createSupabaseServerClient();

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
        .eq("id", id);

    if (error) {
        throw new Error("Failed to update word");
    }

    return { success: true };
}

export async function deleteWord(id: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("words")
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error("Failed to delete word");
    }

    return { success: true };
}
