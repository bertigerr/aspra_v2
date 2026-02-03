"use client";

interface TrainingProgressProps {
    current: number;
    total: number;
}

export function TrainingProgress({ current, total }: TrainingProgressProps) {
    const progress = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="w-full">
            <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Progress</span>
                <span className="font-medium text-white">
                    {current} / {total}
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
