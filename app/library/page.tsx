import { getWords } from "@/app/actions";
import { WordList } from "@/components/features/WordList";

export const dynamic = "force-dynamic"; // Ensure fresh data

export default async function LibraryPage() {
    const words = await getWords();

    return (
        <div className="min-h-screen p-6 pt-12">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Library</h1>
                <p className="text-zinc-400">Your collection of {words.length} words.</p>
            </header>

            <WordList words={words} />
        </div>
    );
}
