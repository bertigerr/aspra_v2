"use client";

import { useEffect, useState, useTransition } from "react";
import { getDueWords, submitReview, type DueWord } from "@/app/actions";
import { FlashCard } from "@/components/features/FlashCard";
import { RatingButtons } from "@/components/features/RatingButtons";
import { TrainingProgress } from "@/components/features/TrainingProgress";
import { TrainingComplete } from "@/components/features/TrainingComplete";
import { Loader2, PartyPopper } from "lucide-react";
import Link from "next/link";

type SessionState = "loading" | "empty" | "training" | "complete";

interface RatingCounts {
    again: number;
    hard: number;
    good: number;
    easy: number;
}

export default function TrainPage() {
    const [state, setState] = useState<SessionState>("loading");
    const [words, setWords] = useState<DueWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [ratingCounts, setRatingCounts] = useState<RatingCounts>({
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
    });
    const [isPending, startTransition] = useTransition();

    // Load due words on mount
    useEffect(() => {
        let cancelled = false;

        async function fetchWords() {
            try {
                const dueWords = await getDueWords();
                if (cancelled) return;
                setWords(dueWords);
                setState(dueWords.length === 0 ? "empty" : "training");
            } catch (error) {
                if (cancelled) return;
                console.error("Failed to load words:", error);
                setState("empty");
            }
        }

        fetchWords();

        return () => {
            cancelled = true;
        };
    }, []);

    function handleFlip() {
        if (!isFlipped) {
            setIsFlipped(true);
        }
    }

    function handleRate(rating: number) {
        const currentWord = words[currentIndex];
        if (!currentWord || isPending) return;

        startTransition(async () => {
            try {
                await submitReview(currentWord.id, rating);

                // Update rating counts
                const key = rating === 1 ? "again" : rating === 2 ? "hard" : rating === 3 ? "good" : "easy";
                setRatingCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));

                // Move to next card or complete
                if (currentIndex + 1 >= words.length) {
                    setState("complete");
                } else {
                    setCurrentIndex((prev) => prev + 1);
                    setIsFlipped(false);
                }
            } catch (error) {
                console.error("Failed to submit review:", error);
            }
        });
    }

    const currentWord = words[currentIndex];

    // Loading state
    if (state === "loading") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="mt-4 text-zinc-400">Loading your cards...</p>
            </div>
        );
    }

    // Empty state (no due words)
    if (state === "empty") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <PartyPopper className="h-10 w-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">All caught up!</h1>
                <p className="mt-2 text-zinc-400">
                    No words to review right now. Add more words or come back later.
                </p>
                <Link
                    href="/app"
                    className="mt-6 rounded-full bg-emerald-500 px-6 py-3 font-medium text-white transition-all hover:bg-emerald-400 active:scale-95"
                >
                    Add Words
                </Link>
            </div>
        );
    }

    // Complete state
    if (state === "complete") {
        const totalReviewed = ratingCounts.again + ratingCounts.hard + ratingCounts.good + ratingCounts.easy;
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <TrainingComplete totalReviewed={totalReviewed} ratingCounts={ratingCounts} />
            </div>
        );
    }

    // Training state
    return (
        <div className="flex min-h-screen flex-col items-center px-4 pb-32 pt-8">
            {/* Progress */}
            <div className="w-full max-w-sm">
                <TrainingProgress current={currentIndex + 1} total={words.length} />
            </div>

            {/* Flash Card */}
            <div className="my-8 flex flex-1 items-center justify-center">
                {currentWord && (
                    <FlashCard
                        word={currentWord}
                        isFlipped={isFlipped}
                        onFlip={handleFlip}
                    />
                )}
            </div>

            {/* Rating Buttons (only show when flipped) */}
            <div className="w-full max-w-sm">
                {isFlipped ? (
                    <RatingButtons onRate={handleRate} disabled={isPending} />
                ) : (
                    <p className="text-center text-sm text-zinc-500">
                        Tap the card to reveal the answer
                    </p>
                )}
            </div>
        </div>
    );
}
