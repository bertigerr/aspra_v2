"use client";

import Link from "next/link";
import { Trophy, Home, RotateCcw, Brain, Check, Zap } from "lucide-react";

interface TrainingCompleteProps {
    totalReviewed: number;
    ratingCounts: {
        again: number;
        hard: number;
        good: number;
        easy: number;
    };
}

export function TrainingComplete({ totalReviewed, ratingCounts }: TrainingCompleteProps) {
    const stats = [
        { label: "Again", count: ratingCounts.again, icon: RotateCcw, color: "text-rose-400" },
        { label: "Hard", count: ratingCounts.hard, icon: Brain, color: "text-orange-400" },
        { label: "Good", count: ratingCounts.good, icon: Check, color: "text-emerald-400" },
        { label: "Easy", count: ratingCounts.easy, icon: Zap, color: "text-sky-400" },
    ];

    return (
        <div className="flex flex-col items-center gap-8 px-4 text-center">
            {/* Trophy */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-2xl">
                <Trophy className="h-12 w-12 text-amber-400" />
            </div>

            {/* Title */}
            <div>
                <h1 className="text-3xl font-bold text-white">Session Complete!</h1>
                <p className="mt-2 text-zinc-400">
                    You reviewed {totalReviewed} {totalReviewed === 1 ? "word" : "words"}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid w-full max-w-xs grid-cols-4 gap-2">
                {stats.map(({ label, count, icon: Icon, color }) => (
                    <div
                        key={label}
                        className="flex flex-col items-center gap-1 rounded-xl bg-white/5 px-2 py-3"
                    >
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-lg font-semibold text-white">{count}</span>
                        <span className="text-[10px] text-zinc-500">{label}</span>
                    </div>
                ))}
            </div>

            {/* Back Home Button */}
            <Link
                href="/app"
                className="mt-4 flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-zinc-900 transition-all hover:bg-zinc-200 active:scale-95"
            >
                <Home className="h-4 w-4" />
                Back to Home
            </Link>
        </div>
    );
}
