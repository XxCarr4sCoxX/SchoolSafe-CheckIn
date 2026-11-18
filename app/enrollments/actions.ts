
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function createEnrollment(formData: FormData) {
    const { supabase } = await requireAdmin();

    const student_id = String(formData.get("student_id") ?? "");
    const classroom_id = String(formData.get("classroom_id") ?? "");
    const academic_year = Number(formData.get("academic_year"));
    const enrollment_date = String(formData.get("enrollment_date") ?? "");

    if (
        !student_id ||
        !classroom_id ||
        !Number.isInteger(academic_year) ||
        academic_year < 2000 ||
        academic_year > 2100
    ) {
        redirect("/enrollments?error=invalid");
    }

    const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, status")
        .eq("id", student_id)
        .maybeSingle();

    if (studentError || !student || student.status !== "active") {
        redirect("/enrollments?error=student");
    }

    const { data: classroom, error: classroomError } = await supabase
        .from("classrooms")
        .select("id, academic_year, capacity")
        .eq("id", classroom_id)
        .maybeSingle();

    if (classroomError || !classroom) {
        redirect("/enrollments?error=classroom");
    }

    if (classroom.academic_year !== academic_year) {
        redirect("/enrollments?error=year");
    }

    const { count, error: countError } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("classroom_id", classroom_id)
        .eq("academic_year", academic_year)
        .eq("status", "active");

    if (countError) {
        console.error("Error checking classroom capacity:", countError);
        redirect("/enrollments?error=capacity");
    }

    if ((count ?? 0) >= classroom.capacity) {
        redirect("/enrollments?error=full");
    }

    const payload = {
        student_id,
        classroom_id,
        academic_year,
        status: "active",
        ...(enrollment_date ? { enrollment_date } : {}),
    };

    const { error } = await supabase
        .from("enrollments")
        .insert(payload);

    if (error) {
        console.error("Error creating enrollment:", error);

        redirect(
            error.code === "23505"
                ? "/enrollments?error=duplicate"
                : "/enrollments?error=create"
        );
    }

    revalidatePath("/enrollments");
    revalidatePath("/students");
    revalidatePath("/classrooms");
    revalidatePath("/dashboard");

    redirect("/enrollments?success=created");
}

export async function updateEnrollment(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "");
    const student_id = String(formData.get("student_id") ?? "");
    const classroom_id = String(formData.get("classroom_id") ?? "");
    const academic_year = Number(formData.get("academic_year"));
    const enrollment_date = String(formData.get("enrollment_date") ?? "");
    const status = String(formData.get("status") ?? "");

    if (
        !id ||
        !student_id ||
        !classroom_id ||
        !Number.isInteger(academic_year) ||
        academic_year < 2000 ||
        academic_year > 2100 ||
        !["active", "withdrawn", "completed"].includes(status)
    ) {
        redirect("/enrollments?error=invalid");
    }

    const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, status")
        .eq("id", student_id)
        .maybeSingle();

    if (studentError || !student) {
        redirect("/enrollments?error=student");
    }

    if (status === "active" && student.status !== "active") {
        redirect("/enrollments?error=student");
    }

    const { data: classroom, error: classroomError } = await supabase
        .from("classrooms")
        .select("id, academic_year, capacity")
        .eq("id", classroom_id)
        .maybeSingle();

    if (classroomError || !classroom) {
        redirect("/enrollments?error=classroom");
    }

    if (classroom.academic_year !== academic_year) {
        redirect("/enrollments?error=year");
    }

    if (status === "active") {
        const { count, error: countError } = await supabase
            .from("enrollments")
            .select("id", { count: "exact", head: true })
            .eq("classroom_id", classroom_id)
            .eq("academic_year", academic_year)
            .eq("status", "active")
            .neq("id", id);

        if (countError) {
            console.error("Error checking classroom capacity:", countError);
            redirect("/enrollments?error=capacity");
        }

        if ((count ?? 0) >= classroom.capacity) {
            redirect("/enrollments?error=full");
        }
    }

    const payload = {
        student_id,
        classroom_id,
        academic_year,
        status,
        ...(enrollment_date ? { enrollment_date } : {}),
    };

    const { data, error } = await supabase
        .from("enrollments")
        .update(payload)
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error updating enrollment:", error);

        redirect(
            error?.code === "23505"
                ? "/enrollments?error=duplicate"
                : "/enrollments?error=update"
        );
    }

    revalidatePath("/enrollments");
    revalidatePath("/students");
    revalidatePath("/classrooms");
    revalidatePath("/dashboard");

    redirect("/enrollments?success=updated");
}

export async function deleteEnrollment(formData: FormData) {
    const { supabase } = await requireAdmin();

    const id = String(formData.get("id") ?? "");

    if (!id) {
        redirect("/enrollments?error=invalid");
    }

    // No eliminar matrículas que tengan historial académico.
    const [
        { count: attendanceCount, error: attendanceError },
        { count: gradesCount, error: gradesError },
    ] = await Promise.all([
        supabase
            .from("attendance")
            .select("id", { count: "exact", head: true })
            .eq("enrollment_id", id),

        supabase
            .from("grades")
            .select("id", { count: "exact", head: true })
            .eq("enrollment_id", id),
    ]);

    if (attendanceError || gradesError) {
        console.error("Error checking enrollment history:", {
            attendanceError,
            gradesError,
        });
        redirect("/enrollments?error=delete");
    }

    if ((attendanceCount ?? 0) > 0 || (gradesCount ?? 0) > 0) {
        redirect("/enrollments?error=related");
    }

    const { data, error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Error deleting enrollment:", error);
        redirect("/enrollments?error=delete");
    }

    revalidatePath("/enrollments");
    revalidatePath("/dashboard");

    redirect("/enrollments?success=deleted");
}
