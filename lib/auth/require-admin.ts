
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/auth/login");
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role, created_at")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
        redirect("/auth/login");
    }

    return {
        supabase,
        user,
        profile,
    };
}
