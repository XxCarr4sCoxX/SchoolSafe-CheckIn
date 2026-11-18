
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

const MAX_SCORE = 20;

function isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

function readGrade(formData: FormData) {
    return {
        enrollment_id: String(formData.get("enrollment_id") ?? "").trim(),
        subject_id: String(formData.get("subject_id") ?? "").trim(),
        evaluation_name: String(formData.get("evaluation_name") ?? "").trim(),
        score: Number(formData.get("score")),
        evaluation_date: String(formData.get("evaluation_date") ?? "").trim(),
    };
}

function validGrade(grade: ReturnType<typeof readGrade>) {
    return (
        Boolean(grade.enrollment_id) &&
        Boolean(grade.subject_id) &&
        grade.evaluation_name.length > 0 &&
        grade.evaluation_name.length <= 120 &&
        Number.isFinite(grade.score) &&
        grade.score >= 0 &&
        grade.score <= MAX_SCORE &&
        (!grade.evaluation_date || isValidDate(grade.evaluation_date))
    );
}

export async function createGrade(formData: FormData) {
    const { supabase, user } = await requireAdmin();
    const grade = readGrade(formData);

    if (!validGrade(grade)) {
        redirect("/grades?error=invalid");
    }

    const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id, status")
        .eq("id", grade.enrollment_id)
        .maybeSingle();

    if (enrollmentError || !enrollment || enrollment.status !== "active") {
        redirect("/grades?error=enrollment");
    }

    const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .select("id")
        .eq("id", grade.subject_id)
        .maybeSingle();

    if (subjectError || !subject) {
        redirect("/grades?error=subject");
    }

    const { error } = await supabase.from("grades").insert({
        enrollment_id: grade.enrollment_id,
        subject_id: grade.subject_id,
        evaluation_name: grade.evaluation_name,
        score: grade.score,
        max_score: MAX_SCORE,
        evaluation_date: grade.evaluation_date || undefined,
        created_by: user.id,
    });

    if (error) {
        console.error("Error creating grade:", error);
        redirect("/grades?error=create");
    }

    revalidatePath("/grades");
    revalidatePath("/dashboard");

    redirect("/grades?success=created");
}

export async function updateGrade(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    const grade = readGrade(formData);

    if (!id || !validGrade(grade)) {
        redirect("/grades?error=invalid");
    }

    const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("id", grade.enrollment_id)
        .maybeSingle();

    if (enrollmentError || !enrollment) {
        redirect("/grades?error=enrollment");
    }

    const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .select("id")
        .eq("id", grade.subject_id)
        .maybeSingle();

    if (subjectError || !subject) {
        redirect("/grades?error=subject");
    }

    const { data, error } = await supabase
        .from("grades")
        .update({
            enrollment_id: grade.enrollment_id,
            subject_id: grade.subject_id,
            evaluation_name: grade.evaluation_name,
            score: grade.score,
            max_score: MAX_SCORE,
            evaluation_date: grade.evaluation_date || undefined,
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error updating grade:", error);
        redirect("/grades?error=update");
    }

    revalidatePath("/grades");
    revalidatePath("/dashboard");

    redirect("/grades?success=updated");
}

export async function deleteGrade(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();

    if (!id) {
        redirect("/grades?error=invalid");
    }

    const { data, error } = await supabase
        .from("grades")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error deleting grade:", error);
        redirect("/grades?error=delete");
    }

    revalidatePath("/grades");
    revalidatePath("/dashboard");

    redirect("/grades?success=deleted");
}
