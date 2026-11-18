
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function createTeacher(formData: FormData) {
    const { supabase } = await requireAdmin();

    const teacher_code = String(formData.get("teacher_code") ?? "").trim().toUpperCase();
    const first_name = String(formData.get("first_name") ?? "").trim();
    const last_name = String(formData.get("last_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!teacher_code || !first_name || !last_name) {
        redirect("/teachers?error=invalid");
    }

    const { error } = await supabase.from("teachers").insert({
        teacher_code,
        first_name,
        last_name,
        email: email || null,
        phone: phone || null,
        status: "active",
    });

    if (error) {
        console.error("Error creating teacher:", error);
        redirect("/teachers?error=create");
    }

    revalidatePath("/teachers");
    revalidatePath("/dashboard");

    redirect("/teachers?success=created");
}

export async function updateTeacher(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "");
    const teacher_code = String(formData.get("teacher_code") ?? "").trim().toUpperCase();
    const first_name = String(formData.get("first_name") ?? "").trim();
    const last_name = String(formData.get("last_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const status = String(formData.get("status") ?? "");

    if (!id || !teacher_code || !first_name || !last_name) {
        redirect("/teachers?error=invalid");
    }

    if (!["active", "inactive"].includes(status)) {
        redirect("/teachers?error=invalid");
    }

    const { data, error } = await supabase
        .from("teachers")
        .update({
            teacher_code,
            first_name,
            last_name,
            email: email || null,
            phone: phone || null,
            status,
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error updating teacher:", error);
        redirect("/teachers?error=update");
    }

    revalidatePath("/teachers");
    revalidatePath("/dashboard");

    redirect("/teachers?success=updated");
}

export async function deleteTeacher(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "");

    if (!id) {
        redirect("/teachers?error=invalid");
    }

    const { data, error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error deleting teacher:", error);
        redirect("/teachers?error=delete");
    }

    revalidatePath("/teachers");
    revalidatePath("/dashboard");

    redirect("/teachers?success=deleted");
}
