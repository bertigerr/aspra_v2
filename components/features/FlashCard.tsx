"use client";

import { motion } from "framer-motion";
import type { DueWord } from "@/app/actions";

interface FlashCardProps {
    word: DueWord;
    isFlipped: boolean;
    onFlip: () => void;
}

export function FlashCard({ word, isFlipped, onFlip }: FlashCardProps) {
    const example = word.examples?.[0];

    return (
        <div
            className="relative h-72 w-full max-w-sm cursor-pointer perspective-1000"
            onClick={onFlip}
            style={{ perspective: "1000px" }}
        >
            <motion.div
                className="relative h-full w-full"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front Side */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-2xl"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <span className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-500">
                        Tap to reveal
                    </span>
                    <h2 className="text-center text-4xl font-bold text-white">
                        {word.text}
                    </h2>
                </div>

                {/* Back Side */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-900/50 to-zinc-800 p-6 shadow-2xl"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-2xl font-semibold text-emerald-400">
                            {word.translation || "—"}
                        </p>

                        {word.definition && (
                            <p className="text-sm text-zinc-400">
                                {word.definition}
                            </p>
                        )}

                        {example && (
                            <div className="mt-2 rounded-xl bg-white/5 px-4 py-3">
                                <p className="text-sm italic text-zinc-300">
                                    &quot;{example.original}&quot;
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                    {example.translated}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
