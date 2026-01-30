import { getWord } from "@/app/actions";
import { notFound } from "next/navigation";
import { EditCardForm } from "./edit-card-form";

export default async function EditCardPage({ params }: { params: { id: string } }) {
    const word = await getWord(params.id);

    if (!word) {
        notFound();
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <EditCardForm word={word} />
        </div>
    );
}
