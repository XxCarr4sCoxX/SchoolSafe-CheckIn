
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

const validStatuses = ["present", "absent", "late", "excused"];

function validDate(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function createAttendance(formData: FormData) {
    const { supabase, user } = await requireAdmin();

    const enrollment_id = String(formData.get("enrollment_id") ?? "").trim();
    const attendance_date = String(formData.get("attendance_date") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (
        !enrollment_id ||
        !validStatuses.includes(status) ||
        (attendance_date && !validDate(attendance_date)) ||
        notes.length > 500
    ) {
        redirect("/attendance?error=invalid");
    }

    const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id, status")
        .eq("id", enrollment_id)
        .maybeSingle();

    if (enrollmentError || !enrollment || enrollment.status !== "active") {
        redirect("/attendance?error=enrollment");
    }

    const payload = {
        enrollment_id,
        status,
        notes: notes || null,
        recorded_by: user.id,
        ...(attendance_date ? { attendance_date } : {}),
    };

    const { error } = await supabase
        .from("attendance")
        .insert(payload);

    if (error) {
        console.error("Error creating attendance:", error);

        redirect(
            error.code === "23505"
                ? "/attendance?error=duplicate"
                : "/attendance?error=create"
        );
    }

    revalidatePath("/attendance");
    revalidatePath("/dashboard");

    redirect("/attendance?success=created");
}

export async function updateAttendance(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    const enrollment_id = String(formData.get("enrollment_id") ?? "").trim();
    const attendance_date = String(formData.get("attendance_date") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (
        !id ||
        !enrollment_id ||
        !validDate(attendance_date) ||
        !validStatuses.includes(status) ||
        notes.length > 500
    ) {
        redirect("/attendance?error=invalid");
    }

    const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("id", enrollment_id)
        .maybeSingle();

    if (enrollmentError || !enrollment) {
        redirect("/attendance?error=enrollment");
    }

    const { data, error } = await supabase
        .from("attendance")
        .update({
            enrollment_id,
            attendance_date,
            status,
            notes: notes || null,
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error updating attendance:", error);

        redirect(
            error?.code === "23505"
                ? "/attendance?error=duplicate"
                : "/attendance?error=update"
        );
    }

    revalidatePath("/attendance");
    revalidatePath("/dashboard");

    redirect("/attendance?success=updated");
}

export async function deleteAttendance(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();

    if (!id) {
        redirect("/attendance?error=invalid");
    }

    const { data, error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error deleting attendance:", error);
        redirect("/attendance?error=delete");
    }

    revalidatePath("/attendance");
    revalidatePath("/dashboard");

    redirect("/attendance?success=deleted");
}
