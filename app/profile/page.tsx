import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
    const supabase = await createSupabaseServerClient();

    // Get user session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get profile data
    const { data: profile } = await supabase
        .from("profiles")
        .select("native_lang")
        .eq("id", user.id)
        .single();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <ProfileForm
                initialNativeLang={profile?.native_lang || "en"}
                email={user.email || ""}
            />
        </div>
    );
}
