"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
    onSearch: (query: string) => Promise<void>;
    isLoading: boolean;
    hasResult: boolean;
}

export function SearchInput({ onSearch, isLoading, hasResult }: SearchInputProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        await onSearch(query);
    };

    // Auto-focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div
            className={cn(
                "w-full max-w-md transition-all duration-700 ease-in-out",
                hasResult ? "-translate-y-8 scale-95 opacity-0 pointer-events-none absolute" : "translate-y-0 opacity-100"
            )}
        >
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
                    Aspra.
                </h1>
                <p className="text-sm text-white/40">Что хочешь выучить сегодня?</p>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-0 -skew-y-1 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-2 pl-5 focus-within:bg-white/10 focus-within:border-white/20 transition-all duration-300 shadow-lg shadow-black/20">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isLoading}
                        placeholder="Type a word..."
                        className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-white/20 text-white"
                    />

                    <Button
                        type="submit"
                        size="icon"
                        disabled={!query.trim() || isLoading}
                        className={cn(
                            "ml-2 h-10 w-10 rounded-xl transition-all duration-300",
                            query.trim()
                                ? "bg-white text-black hover:bg-emerald-400 hover:scale-105"
                                : "bg-white/5 text-white/20 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <ArrowUp className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
