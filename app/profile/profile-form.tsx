"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LogOut, Save } from "lucide-react";
// Import the server action - but wait, usually we pass it or import it. 
// Standard Next.js actions allow importing.
import { updateProfile } from "@/app/actions";

interface ProfileFormProps {
    initialNativeLanguage: string;
    email: string;
}

export function ProfileForm({ initialNativeLanguage, email }: ProfileFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSignOut = async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/login"); // or refresh needed?
        router.refresh();
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setMessage(null);
        try {
            await updateProfile(formData);
            setMessage("Profile updated successfully!");
        } catch (error) {
            console.error(error);
            setMessage("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur shadow-2xl">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold text-white">Profile</h1>
                <p className="text-white/50">{email}</p>
            </div>

            <form action={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="native_language" className="text-sm font-medium text-white/70">
                        Native Language
                    </label>
                    <div className="relative">
                        <select
                            id="native_language"
                            name="native_language"
                            defaultValue={initialNativeLanguage}
                            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/10 px-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                        >
                            <option value="ru" className="bg-zinc-900">Русский</option>
                            <option value="en" className="bg-zinc-900">English</option>
                            <option value="es" className="bg-zinc-900">Español</option>
                            <option value="de" className="bg-zinc-900">Deutsch</option>
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>

                {message && (
                    <p className={`text-sm ${message.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
                        {message}
                    </p>
                )}

                <Button
                    type="submit"
                    className="w-full bg-white text-zinc-950 hover:bg-white/90"
                    disabled={loading}
                >
                    {loading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
            </form>

            <div className="pt-6 border-t border-white/10">
                <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-950/30"
                >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
            </div>
        </div>
    );
}
