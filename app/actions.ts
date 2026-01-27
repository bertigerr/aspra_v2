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
