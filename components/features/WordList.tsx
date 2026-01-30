"use client";

import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Word {
    id: string;
    text: string;
    translation: string | null;
    definition: string | null;
    created_at: string;
    state: number; // FSRS state
}

interface WordListProps {
    words: Word[];
}

export function WordList({ words }: WordListProps) {
    const router = useRouter();

    if (words.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground mb-4">You haven&apos;t saved any words yet.</p>
                <p className="text-sm text-zinc-500">Go to Home to analyze and save new words!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-32">
            {words.map((word, index) => (
                <motion.div
                    key={word.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => router.push(`/library/${word.id}`)}
                    className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm transition-all hover:bg-white/10 cursor-pointer"
                >
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{word.text}</h3>
                            <p className="text-emerald-400 font-medium">{word.translation}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                                {new Date(word.created_at).toLocaleDateString()}
                            </span>
                            {/* State badge for debugging/info */}
                            <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
                                State: {word.state}
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 border-t border-white/5 pt-3">
                        <p className="text-sm text-zinc-400 line-clamp-2">{word.definition}</p>
                    </div>

                    <div className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Add audio playing logic here later
                            }}
                        >
                            <Volume2 className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
