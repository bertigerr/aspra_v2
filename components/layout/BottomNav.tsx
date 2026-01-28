"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BookOpen, BarChart2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/library", label: "Library", icon: BookOpen },
    { href: "/train", label: "Train", icon: Dumbbell }, // Center item
    { href: "/stats", label: "Stats", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 transform">
            <div className="relative flex items-center justify-between rounded-full border border-white/10 bg-[#0F1117]/80 px-2 py-2 shadow-2xl backdrop-blur-xl backdrop-saturate-150">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    const isMainAction = item.label === "Train";

                    if (isMainAction) {
                        return (
                            <div key={item.href} className="relative -top-6 mx-2">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95",
                                        isActive
                                            ? "bg-emerald-400 text-zinc-950 shadow-emerald-400/50"
                                            : "bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-400"
                                    )}
                                >
                                    <Icon className="h-6 w-6" />
                                </Link>
                                <span className={cn(
                                    "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium transition-opacity duration-300",
                                    isActive ? "text-white opacity-100" : "text-zinc-500 opacity-0"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 transition-all duration-300",
                                isActive
                                    ? "text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {/* Active pill indicator for normal items */}
                            {isActive && (
                                <span className="absolute inset-0 rounded-full bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300" />
                            )}

                            <Icon className={cn("relative z-10 h-5 w-5 transition-transform duration-300", isActive && "scale-110")} />
                            <span className={cn("relative z-10 text-[10px] font-medium transition-opacity duration-300",
                                isActive ? "opacity-100" : "opacity-70"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
