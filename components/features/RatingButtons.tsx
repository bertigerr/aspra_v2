"use client";

import { RotateCcw, Brain, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingButtonsProps {
    onRate: (rating: number) => void;
    disabled?: boolean;
}

const ratings = [
    { value: 1, label: "Again", icon: RotateCcw, color: "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30" },
    { value: 2, label: "Hard", icon: Brain, color: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30" },
    { value: 3, label: "Good", icon: Check, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30" },
    { value: 4, label: "Easy", icon: Zap, color: "bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30" },
];

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
    return (
        <div className="grid grid-cols-4 gap-2">
            {ratings.map(({ value, label, icon: Icon, color }) => (
                <button
                    key={value}
                    onClick={() => onRate(value)}
                    disabled={disabled}
                    className={cn(
                        "flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                        color
                    )}
                >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                </button>
            ))}
        </div>
    );
}
