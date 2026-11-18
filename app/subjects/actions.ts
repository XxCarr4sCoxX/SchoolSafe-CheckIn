
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function createSubject(formData: FormData) {
    const { supabase } = await requireAdmin();

    const subject_code = String(formData.get("subject_code") ?? "")
        .trim()
        .toUpperCase();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (
        !subject_code ||
        !name ||
        subject_code.length > 30 ||
        name.length > 120 ||
        description.length > 500
    ) {
        redirect("/subjects?error=invalid");
    }

    const { error } = await supabase.from("subjects").insert({
        subject_code,
        name,
        description: description || null,
    });

    if (error) {
        console.error("Error creating subject:", error);

        redirect(
            error.code === "23505"
                ? "/subjects?error=duplicate"
                : "/subjects?error=create"
        );
    }

    revalidatePath("/subjects");
    revalidatePath("/grades");
    revalidatePath("/dashboard");

    redirect("/subjects?success=created");
}

export async function updateSubject(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();

    const subject_code = String(formData.get("subject_code") ?? "")
        .trim()
        .toUpperCase();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (
        !id ||
        !subject_code ||
        !name ||
        subject_code.length > 30 ||
        name.length > 120 ||
        description.length > 500
    ) {
        redirect("/subjects?error=invalid");
    }

    const { data, error } = await supabase
        .from("subjects")
        .update({
            subject_code,
            name,
            description: description || null,
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error updating subject:", error);

        redirect(
            error?.code === "23505"
                ? "/subjects?error=duplicate"
                : "/subjects?error=update"
        );
    }

    revalidatePath("/subjects");
    revalidatePath("/grades");
    revalidatePath("/dashboard");

    redirect("/subjects?success=updated");
}

export async function deleteSubject(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();

    if (!id) {
        redirect("/subjects?error=invalid");
    }

    const { data, error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error) {
        console.error("Error deleting subject:", error);

        redirect(
            error.code === "23503"
                ? "/subjects?error=related"
                : "/subjects?error=delete"
        );
    }

    if (!data) {
        redirect("/subjects?error=delete");
    }

    revalidatePath("/subjects");
    revalidatePath("/grades");
    revalidatePath("/dashboard");

    redirect("/subjects?success=deleted");
}
