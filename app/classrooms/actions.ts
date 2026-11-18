
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function createClassroom(formData: FormData) {
    const { supabase } = await requireAdmin();

    const grade_level = String(formData.get("grade_level") ?? "").trim();
    const section = String(formData.get("section") ?? "").trim().toUpperCase();
    const academic_year = Number(formData.get("academic_year"));
    const capacity = Number(formData.get("capacity"));

    if (
        !grade_level ||
        !section ||
        !Number.isInteger(academic_year) ||
        academic_year < 2000 ||
        academic_year > 2100 ||
        !Number.isInteger(capacity) ||
        capacity <= 0
    ) {
        redirect("/classrooms?error=invalid");
    }

    const { error } = await supabase.from("classrooms").insert({
        grade_level,
        section,
        academic_year,
        capacity,
    });

    if (error) {
        console.error("Error creating classroom:", error);
        redirect(
            error.code === "23505"
                ? "/classrooms?error=duplicate"
                : "/classrooms?error=create"
        );
    }

    revalidatePath("/classrooms");
    revalidatePath("/dashboard");

    redirect("/classrooms?success=created");
}

export async function updateClassroom(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "");
    const grade_level = String(formData.get("grade_level") ?? "").trim();
    const section = String(formData.get("section") ?? "").trim().toUpperCase();
    const academic_year = Number(formData.get("academic_year"));
    const capacity = Number(formData.get("capacity"));

    if (
        !id ||
        !grade_level ||
        !section ||
        !Number.isInteger(academic_year) ||
        academic_year < 2000 ||
        academic_year > 2100 ||
        !Number.isInteger(capacity) ||
        capacity <= 0
    ) {
        redirect("/classrooms?error=invalid");
    }

    const { data, error } = await supabase
        .from("classrooms")
        .update({
            grade_level,
            section,
            academic_year,
            capacity,
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error updating classroom:", error);
        redirect(
            error?.code === "23505"
                ? "/classrooms?error=duplicate"
                : "/classrooms?error=update"
        );
    }

    revalidatePath("/classrooms");
    revalidatePath("/dashboard");

    redirect("/classrooms?success=updated");
}

export async function deleteClassroom(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "");

    if (!id) {
        redirect("/classrooms?error=invalid");
    }

    const { data, error } = await supabase
        .from("classrooms")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error deleting classroom:", error);
        redirect("/classrooms?error=delete");
    }

    revalidatePath("/classrooms");
    revalidatePath("/dashboard");

    redirect("/classrooms?success=deleted");
}
