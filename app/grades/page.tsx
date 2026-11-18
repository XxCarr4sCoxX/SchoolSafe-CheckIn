
import AdminShell from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import DeleteGradeButton from "./DeleteGradeButton";
import { createGrade, updateGrade } from "./actions";
import {
    Search,
    BookOpen,
    UserPlus,
    Edit3,
    Award,
} from "lucide-react";

interface GradesPageProps {
    searchParams: Promise<{
        q?: string;
        success?: string;
        error?: string;
    }>;
}

const messages: Record<string, string> = {
    created: "Calificación registrada correctamente.",
    updated: "Calificación actualizada correctamente.",
    deleted: "Calificación eliminada correctamente.",
};

const errors: Record<string, string> = {
    invalid: "Verifica los datos y comprueba que la nota esté entre 0 y 20.",
    enrollment: "La matrícula seleccionada no existe o no está disponible.",
    subject: "La asignatura seleccionada no existe.",
    create: "No se pudo registrar la calificación.",
    update: "No se pudo actualizar la calificación.",
    delete: "No se pudo eliminar la calificación.",
};

export default async function GradesPage({
    searchParams,
}: GradesPageProps) {
    const { supabase } = await requireAdmin();
    const params = await searchParams;

    const search = (params.q ?? "").trim().toLocaleLowerCase("es");

    const [
        { data: gradesData, error: gradesError },
        { data: enrollmentsData, error: enrollmentsError },
        { data: studentsData, error: studentsError },
        { data: subjectsData, error: subjectsError },
    ] = await Promise.all([
        supabase
            .from("grades")
            .select("id, enrollment_id, subject_id, evaluation_name, score, max_score, evaluation_date, created_at")
            .order("evaluation_date", { ascending: false }),

        supabase
            .from("enrollments")
            .select("id, student_id, academic_year, status"),

        supabase
            .from("students")
            .select("id, student_code, first_name, last_name, status"),

        supabase
            .from("subjects")
            .select("id, subject_code, name, description")
            .order("name"),
    ]);

    const queryError =
        gradesError ||
        enrollmentsError ||
        studentsError ||
        subjectsError;

    const enrollments = enrollmentsData ?? [];
    const students = studentsData ?? [];
    const subjects = subjectsData ?? [];

    const enrollmentMap = new Map(
        enrollments.map((enrollment) => [enrollment.id, enrollment])
    );

    const studentMap = new Map(
        students.map((student) => [student.id, student])
    );

    const subjectMap = new Map(
        subjects.map((subject) => [subject.id, subject])
    );

    const allGrades = (gradesData ?? []).map((grade) => {
        const enrollment = enrollmentMap.get(grade.enrollment_id);

        const student = enrollment
            ? studentMap.get(enrollment.student_id)
            : undefined;

        const subject = subjectMap.get(grade.subject_id);

        return {
            ...grade,
            studentName: student
                ? `${student.first_name} ${student.last_name}`
                : "Estudiante no disponible",
            studentCode: student?.student_code ?? "—",
            subjectName: subject?.name ?? "Asignatura no disponible",
            academicYear: enrollment?.academic_year ?? "—",
        };
    });

    const grades = allGrades.filter((grade) => {
        const searchable = [
            grade.studentName,
            grade.studentCode,
            grade.subjectName,
            grade.evaluation_name,
            String(grade.score),
            grade.evaluation_date,
        ]
            .join(" ")
            .toLocaleLowerCase("es");

        return searchable.includes(search);
    });

    const average =
        allGrades.length > 0
            ? allGrades.reduce((total, grade) => total + Number(grade.score), 0) /
            allGrades.length
            : 0;

    const activeEnrollments = enrollments.filter((enrollment) => {
        const student = studentMap.get(enrollment.student_id);

        return (
            enrollment.status === "active" &&
            student?.status === "active"
        );
    });

    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    return (
        <AdminShell>
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Gestión de calificaciones
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Registra, consulta y administra las notas de los estudiantes.
                    </p>
                </div>

                <a
                    href="#formulario-calificacion"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                    <UserPlus className="h-5 w-5" />
                    Nueva calificación
                </a>
            </div>

            {params.success && messages[params.success] && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    {messages[params.success]}
                </div>
            )}

            {(queryError || params.error) && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {queryError
                        ? `Error al consultar la información: ${queryError.message}`
                        : errors[params.error ?? ""] ?? "Ha ocurrido un error."}
                </div>
            )}

            {/* TARJETAS ESTADÍSTICAS */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Total de calificaciones
                            </p>
                            <p className="mt-2 text-3xl font-bold text-blue-700">
                                {allGrades.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                            <BookOpen className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Promedio general
                            </p>
                            <p className="mt-2 text-3xl font-bold text-green-700">
                                {average.toFixed(2)}
                                <span className="ml-1 text-base text-gray-400">/20</span>
                            </p>
                        </div>

                        <div className="rounded-xl bg-green-50 p-3 text-green-700">
                            <Award className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Asignaturas disponibles
                            </p>
                            <p className="mt-2 text-3xl font-bold text-purple-700">
                                {subjects.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
                            <BookOpen className="h-7 w-7" />
                        </div>
                    </div>
                </div>
            </div>

            {/* FORMULARIO DE REGISTRO */}
            <section
                id="formulario-calificacion"
                className="mb-7 scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <UserPlus className="h-5 w-5 text-blue-700" />
                    Registrar nueva calificación
                </h3>

                {activeEnrollments.length === 0 || subjects.length === 0 ? (
                    <p className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                        Necesitas tener matrículas activas y asignaturas registradas para
                        poder ingresar calificaciones.
                    </p>
                ) : (
                    <form
                        action={createGrade}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        <div>
                            <label
                                htmlFor="enrollment_id"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Estudiante y matrícula *
                            </label>

                            <select
                                id="enrollment_id"
                                name="enrollment_id"
                                required
                                defaultValue=""
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900"
                            >
                                <option value="" disabled>
                                    Seleccionar estudiante
                                </option>

                                {activeEnrollments.map((enrollment) => {
                                    const student = studentMap.get(enrollment.student_id);

                                    return (
                                        <option key={enrollment.id} value={enrollment.id}>
                                            {student?.student_code} - {student?.first_name}{" "}
                                            {student?.last_name} | {enrollment.academic_year}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="subject_id"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Asignatura *
                            </label>

                            <select
                                id="subject_id"
                                name="subject_id"
                                required
                                defaultValue=""
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900"
                            >
                                <option value="" disabled>
                                    Seleccionar asignatura
                                </option>

                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="evaluation_name"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Nombre de evaluación *
                            </label>

                            <input
                                id="evaluation_name"
                                name="evaluation_name"
                                placeholder="Ej. Examen parcial"
                                maxLength={120}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="score"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Calificación (0 a 20) *
                            </label>

                            <input
                                id="score"
                                name="score"
                                type="number"
                                min="0"
                                max="20"
                                step="0.01"
                                placeholder="Ej. 18.50"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="evaluation_date"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Fecha de evaluación
                            </label>

                            <input
                                id="evaluation_date"
                                name="evaluation_date"
                                type="date"
                                defaultValue={today}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800"
                            >
                                Guardar calificación
                            </button>
                        </div>
                    </form>
                )}
            </section>

            {/* LISTADO DE CALIFICACIONES */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Registro de calificaciones
                        </h3>

                        <p className="text-sm text-gray-500">
                            {grades.length} registro(s) encontrado(s)
                        </p>
                    </div>

                    <form method="GET" action="/grades" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                                type="search"
                                name="q"
                                defaultValue={params.q ?? ""}
                                placeholder="Buscar estudiante o curso..."
                                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 sm:w-64"
                            />
                        </div>

                        <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
                            Buscar
                        </button>
                    </form>
                </div>

                {queryError ? (
                    <p className="p-8 text-center text-red-600">
                        No fue posible cargar las calificaciones.
                    </p>
                ) : grades.length === 0 ? (
                    <p className="p-10 text-center text-gray-500">
                        {search
                            ? "No se encontraron calificaciones con esa búsqueda."
                            : "Todavía no existen calificaciones registradas."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Estudiante</th>
                                    <th className="px-5 py-4">Código</th>
                                    <th className="px-5 py-4">Asignatura</th>
                                    <th className="px-5 py-4">Evaluación</th>
                                    <th className="px-5 py-4">Nota</th>
                                    <th className="px-5 py-4">Fecha</th>
                                    <th className="px-5 py-4">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {grades.map((grade) => (
                                    <tr key={grade.id} className="hover:bg-blue-50/40">
                                        <td className="px-5 py-4 font-medium text-gray-800">
                                            {grade.studentName}
                                        </td>

                                        <td className="px-5 py-4 text-blue-800">
                                            {grade.studentCode}
                                        </td>

                                        <td className="px-5 py-4 text-gray-700">
                                            {grade.subjectName}
                                        </td>

                                        <td className="px-5 py-4 text-gray-700">
                                            {grade.evaluation_name}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-3 py-1 font-semibold ${Number(grade.score) >= 11
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                                }`}>
                                                {Number(grade.score).toFixed(2)} / {Number(grade.max_score).toFixed(2)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-gray-600">
                                            {new Date(
                                                `${grade.evaluation_date}T00:00:00`
                                            ).toLocaleDateString("es-PE")}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <details className="relative">
                                                    <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                                                        <Edit3 className="h-4 w-4" />
                                                        Editar
                                                    </summary>

                                                    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
                                                        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                                                            <div className="mb-5 flex items-center justify-between">
                                                                <h3 className="text-lg font-bold text-gray-900">
                                                                    Editar calificación
                                                                </h3>

                                                                <a
                                                                    href="/grades"
                                                                    aria-label="Cerrar formulario"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                                                >
                                                                    ✕
                                                                </a>
                                                            </div>

                                                            <form action={updateGrade} className="space-y-4">
                                                                <input
                                                                    type="hidden"
                                                                    name="id"
                                                                    value={grade.id}
                                                                />

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Estudiante
                                                                    </label>

                                                                    <select
                                                                        name="enrollment_id"
                                                                        defaultValue={grade.enrollment_id}
                                                                        required
                                                                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                                                                    >
                                                                        {enrollments.map((enrollment) => {
                                                                            const student = studentMap.get(enrollment.student_id);

                                                                            return (
                                                                                <option
                                                                                    key={enrollment.id}
                                                                                    value={enrollment.id}
                                                                                >
                                                                                    {student?.student_code} - {student?.first_name}{" "}
                                                                                    {student?.last_name} | {enrollment.academic_year}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Asignatura
                                                                    </label>

                                                                    <select
                                                                        name="subject_id"
                                                                        defaultValue={grade.subject_id}
                                                                        required
                                                                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                                                                    >
                                                                        {subjects.map((subject) => (
                                                                            <option key={subject.id} value={subject.id}>
                                                                                {subject.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Evaluación
                                                                    </label>

                                                                    <input
                                                                        name="evaluation_name"
                                                                        required
                                                                        maxLength={120}
                                                                        defaultValue={grade.evaluation_name}
                                                                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Calificación (0 a 20)
                                                                    </label>

                                                                    <input
                                                                        name="score"
                                                                        type="number"
                                                                        min="0"
                                                                        max="20"
                                                                        step="0.01"
                                                                        required
                                                                        defaultValue={grade.score}
                                                                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Fecha
                                                                    </label>

                                                                    <input
                                                                        name="evaluation_date"
                                                                        type="date"
                                                                        required
                                                                        defaultValue={grade.evaluation_date}
                                                                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                                                    />
                                                                </div>

                                                                <button
                                                                    type="submit"
                                                                    className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800"
                                                                >
                                                                    Guardar cambios
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </details>

                                                <DeleteGradeButton gradeId={grade.id} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AdminShell>
    );
}
