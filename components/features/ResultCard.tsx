"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIAnalysisResult } from "@/app/actions";
import { cn } from "@/lib/utils";

interface ResultCardProps {
    result: AIAnalysisResult;
    onSave?: () => void;
    isSaving?: boolean;
}

export function ResultCard({ result, onSave, isSaving }: ResultCardProps) {
    return (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative overflow-hidden rounded-3xl bg-white/5 p-6 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/20">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-1">
                            {result.text}
                        </h2>
                        <p className="text-lg font-medium text-emerald-400">
                            {result.translation}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                    >
                        <Volume2 className="h-6 w-6" />
                    </Button>
                </div>

                {/* Definition */}
                <div className="mb-6 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                        Definition
                    </p>
                    <p className="leading-relaxed text-white/90">{result.definition}</p>
                </div>

                {/* Examples */}
                <div className="space-y-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                        Examples
                    </p>
                    <div className="space-y-3">
                        {result.examples.map((ex, i) => (
                            <div
                                key={i}
                                className="group relative border-l-2 border-white/10 pl-4 transition-colors hover:border-emerald-500/50"
                            >
                                <p className="text-sm italic text-white/80">{ex.original}</p>
                                <p className="text-xs text-white/50">{ex.translated}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action */}
                <div className="mt-8 pt-6 border-t border-white/5">
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className={cn(
                            "w-full h-12 rounded-xl text-base font-medium transition-all",
                            "bg-white text-zinc-950 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]",
                            isSaving && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isSaving ? "Saving..." : "Save to Dictionary"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
