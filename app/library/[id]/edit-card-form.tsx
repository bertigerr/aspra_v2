"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateWord, deleteWord } from "@/app/actions";
import { Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditCardFormProps {
    word: {
        id: string;
        text: string;
        translation: string | null;
        definition: string | null;
    };
}

export function EditCardForm({ word }: EditCardFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSave = async (formData: FormData) => {
        setLoading(true);
        setMessage(null);
        try {
            await updateWord(word.id, formData);
            setMessage("Word updated successfully!");
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage("Failed to update word.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this word?")) return;

        setLoading(true);
        try {
            await deleteWord(word.id);
            router.push("/library");
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage("Failed to delete word.");
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-6">
            <Link href="/library" className="inline-flex items-center text-sm text-white/50 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
            </Link>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Edit Card</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-950/30 hover:text-red-300"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>

                <form action={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70">Text</label>
                        <Input
                            name="text"
                            defaultValue={word.text}
                            className="border-white/10 bg-white/10 text-white placeholder:text-white/40"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70">Translation</label>
                        <Input
                            name="translation"
                            defaultValue={word.translation || ""}
                            className="border-white/10 bg-white/10 text-white placeholder:text-white/40"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70">Definition</label>
                        <textarea
                            name="definition"
                            defaultValue={word.definition || ""}
                            rows={3}
                            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
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
            </div>
        </div>
    );
}
