"use client";

import { useState } from "react";
import { SearchInput } from "@/components/features/SearchInput";
import { ResultCard } from "@/components/features/ResultCard";
import { analyzeWord, saveWord, AIAnalysisResult } from "@/app/actions";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      // TODO: Get user settings for target/native language
      const data = await analyzeWord(query);
      setResult(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze word. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden bg-zinc-950 text-white">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <SearchInput
          onSearch={handleSearch}
          isLoading={loading}
          hasResult={!!result}
        />

        {result && (
          <div className="w-full flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <ResultCard
              result={result}
              onSave={async () => {
                try {
                  await saveWord(result);
                  toast.success("Saved to dictionary!");
                  setResult(null); // Clear after save to encourage next search
                } catch (e) {
                  toast.error("Failed to save. Are you logged in?");
                }
              }}
            />

            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-white/50 hover:text-white"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Scan another word
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
