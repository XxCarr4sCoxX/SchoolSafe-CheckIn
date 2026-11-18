
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function createStudent(formData: FormData) {
    const { supabase } = await requireAdmin();

    const student_code = String(formData.get("student_code") ?? "").trim().toUpperCase();
    const first_name = String(formData.get("first_name") ?? "").trim();
    const last_name = String(formData.get("last_name") ?? "").trim();
    const birth_date = String(formData.get("birth_date") ?? "").trim();

    if (!student_code || !first_name || !last_name) {
        redirect("/students?error=invalid");
    }

    const { error } = await supabase.from("students").insert({
        student_code,
        first_name,
        last_name,
        birth_date: birth_date || null,
        status: "active",
    });

    if (error) {
        console.error("Error creating student:", error);
        redirect("/students?error=create");
    }

    revalidatePath("/students");
    revalidatePath("/dashboard");

    redirect("/students?success=created");
}

export async function updateStudent(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "");
    const student_code = String(formData.get("student_code") ?? "").trim().toUpperCase();
    const first_name = String(formData.get("first_name") ?? "").trim();
    const last_name = String(formData.get("last_name") ?? "").trim();
    const birth_date = String(formData.get("birth_date") ?? "").trim();
    const status = String(formData.get("status") ?? "");

    if (!id || !student_code || !first_name || !last_name) {
        redirect("/students?error=invalid");
    }

    if (!["active", "inactive", "graduated"].includes(status)) {
        redirect("/students?error=invalid");
    }

    const { data, error } = await supabase
        .from("students")
        .update({
            student_code,
            first_name,
            last_name,
            birth_date: birth_date || null,
            status,
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error updating student:", error);
        redirect("/students?error=update");
    }

    revalidatePath("/students");
    revalidatePath("/dashboard");

    redirect("/students?success=updated");
}

export async function deleteStudent(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "");

    if (!id) {
        redirect("/students?error=invalid");
    }

    const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting student:", error);
        redirect("/students?error=delete");
    }

    revalidatePath("/students");
    revalidatePath("/dashboard");

    redirect("/students?success=deleted");
}
