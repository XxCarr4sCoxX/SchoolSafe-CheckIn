
import AdminShell from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import DeleteEnrollmentButton from "./DeleteEnrollmentButton";
import { createEnrollment, updateEnrollment } from "./actions";
import {
    Search,
    ClipboardList,
    UserPlus,
    Edit3,
} from "lucide-react";

interface EnrollmentsPageProps {
    searchParams: Promise<{
        q?: string;
        success?: string;
        error?: string;
    }>;
}

const messages: Record<string, string> = {
    created: "Matrícula registrada correctamente.",
    updated: "Matrícula actualizada correctamente.",
    deleted: "Matrícula eliminada correctamente.",
};

const errors: Record<string, string> = {
    invalid: "Verifica los datos ingresados.",
    student: "El estudiante no existe o no está habilitado para esta matrícula.",
    classroom: "El aula seleccionada no existe.",
    year: "El año académico no coincide con el año del aula.",
    capacity: "No se pudo comprobar la capacidad del aula.",
    full: "El aula ya alcanzó su capacidad máxima.",
    duplicate: "Este estudiante ya tiene una matrícula en ese año académico.",
    create: "No se pudo registrar la matrícula.",
    update: "No se pudo actualizar la matrícula.",
    delete: "No se pudo eliminar la matrícula.",
    related: "No se puede eliminar: esta matrícula tiene asistencias o calificaciones relacionadas.",
};

export default async function EnrollmentsPage({
    searchParams,
}: EnrollmentsPageProps) {
    const { supabase } = await requireAdmin();
    const params = await searchParams;

    const search = (params.q ?? "").trim().toLocaleLowerCase("es");

    const [
        { data: enrollments, error: enrollmentError },
        { data: students, error: studentError },
        { data: classrooms, error: classroomError },
    ] = await Promise.all([
        supabase
            .from("enrollments")
            .select("id, student_id, classroom_id, academic_year, enrollment_date, status, created_at")
            .order("enrollment_date", { ascending: false }),

        supabase
            .from("students")
            .select("id, student_code, first_name, last_name, status")
            .order("last_name"),

        supabase
            .from("classrooms")
            .select("id, grade_level, section, academic_year, capacity")
            .order("academic_year", { ascending: false }),
    ]);

    const queryError = enrollmentError || studentError || classroomError;

    const studentMap = new Map(
        (students ?? []).map((student) => [student.id, student])
    );

    const classroomMap = new Map(
        (classrooms ?? []).map((classroom) => [classroom.id, classroom])
    );

    const allEnrollments = (enrollments ?? []).map((enrollment) => {
        const student = studentMap.get(enrollment.student_id);
        const classroom = classroomMap.get(enrollment.classroom_id);

        return {
            ...enrollment,
            studentName: student
                ? `${student.first_name} ${student.last_name}`
                : "Estudiante no disponible",
            studentCode: student?.student_code ?? "—",
            classroomName: classroom
                ? `${classroom.grade_level} - ${classroom.section}`
                : "Aula no disponible",
        };
    });

    const filteredEnrollments = allEnrollments.filter((enrollment) => {
        const searchable = [
            enrollment.studentName,
            enrollment.studentCode,
            enrollment.classroomName,
            String(enrollment.academic_year),
            enrollment.status,
        ].join(" ").toLocaleLowerCase("es");

        return searchable.includes(search);
    });

    const activeCount = allEnrollments.filter(
        (enrollment) => enrollment.status === "active"
    ).length;

    const studentOptions = students ?? [];
    const classroomOptions = classrooms ?? [];

    return (
        <AdminShell>
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Gestión de matrículas
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Inscribe estudiantes en sus respectivas aulas.
                    </p>
                </div>

                <a
                    href="#formulario-matricula"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                    <UserPlus className="h-5 w-5" />
                    Nueva matrícula
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
                        ? `Error al consultar los datos: ${queryError.message}`
                        : errors[params.error ?? ""] ?? "Ha ocurrido un error."}
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total de matrículas</p>
                    <p className="mt-2 text-3xl font-bold text-blue-700">
                        {allEnrollments.length}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Matrículas activas</p>
                    <p className="mt-2 text-3xl font-bold text-green-700">
                        {activeCount}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Otros estados</p>
                    <p className="mt-2 text-3xl font-bold text-orange-600">
                        {allEnrollments.length - activeCount}
                    </p>
                </div>
            </div>

            <section
                id="formulario-matricula"
                className="mb-7 scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <ClipboardList className="h-5 w-5 text-blue-700" />
                    Registrar nueva matrícula
                </h3>

                {studentOptions.filter((student) => student.status === "active").length === 0 ||
                    classroomOptions.length === 0 ? (
                    <p className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                        Necesitas tener al menos un estudiante activo y un aula registrada
                        para crear una matrícula.
                    </p>
                ) : (
                    <form
                        action={createEnrollment}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
                    >
                        <div>
                            <label htmlFor="student_id" className="mb-2 block text-sm font-medium text-gray-700">
                                Estudiante *
                            </label>

                            <select
                                id="student_id"
                                name="student_id"
                                required
                                defaultValue=""
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                            >
                                <option value="" disabled>Seleccionar estudiante</option>

                                {studentOptions
                                    .filter((student) => student.status === "active")
                                    .map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.student_code} - {student.first_name} {student.last_name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="classroom_id" className="mb-2 block text-sm font-medium text-gray-700">
                                Aula *
                            </label>

                            <select
                                id="classroom_id"
                                name="classroom_id"
                                required
                                defaultValue=""
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                            >
                                <option value="" disabled>Seleccionar aula</option>

                                {classroomOptions.map((classroom) => (
                                    <option key={classroom.id} value={classroom.id}>
                                        {classroom.grade_level} - {classroom.section} ({classroom.academic_year})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="academic_year" className="mb-2 block text-sm font-medium text-gray-700">
                                Año académico *
                            </label>

                            <input
                                id="academic_year"
                                name="academic_year"
                                type="number"
                                min="2000"
                                max="2100"
                                defaultValue={new Date().getFullYear()}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                            />
                        </div>

                        <div>
                            <label htmlFor="enrollment_date" className="mb-2 block text-sm font-medium text-gray-700">
                                Fecha de matrícula
                            </label>

                            <input
                                id="enrollment_date"
                                name="enrollment_date"
                                type="date"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-4">
                            <button
                                type="submit"
                                className="rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800"
                            >
                                Registrar matrícula
                            </button>
                        </div>
                    </form>
                )}
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Lista de matrículas
                        </h3>
                        <p className="text-sm text-gray-500">
                            {filteredEnrollments.length} registro(s) encontrado(s)
                        </p>
                    </div>

                    <form method="GET" action="/enrollments" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                name="q"
                                defaultValue={params.q ?? ""}
                                placeholder="Buscar estudiante o aula..."
                                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm sm:w-64"
                            />
                        </div>

                        <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
                            Buscar
                        </button>
                    </form>
                </div>

                {queryError ? (
                    <p className="p-8 text-center text-red-600">
                        No se pudieron cargar las matrículas.
                    </p>
                ) : filteredEnrollments.length === 0 ? (
                    <p className="p-10 text-center text-gray-500">
                        {search
                            ? "No se encontraron matrículas."
                            : "Todavía no hay matrículas registradas."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Estudiante</th>
                                    <th className="px-5 py-4">Código</th>
                                    <th className="px-5 py-4">Aula</th>
                                    <th className="px-5 py-4">Año</th>
                                    <th className="px-5 py-4">Fecha</th>
                                    <th className="px-5 py-4">Estado</th>
                                    <th className="px-5 py-4">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {filteredEnrollments.map((enrollment) => (
                                    <tr key={enrollment.id} className="hover:bg-blue-50/40">
                                        <td className="px-5 py-4 font-medium text-gray-800">
                                            {enrollment.studentName}
                                        </td>

                                        <td className="px-5 py-4 text-blue-800">
                                            {enrollment.studentCode}
                                        </td>

                                        <td className="px-5 py-4 text-gray-700">
                                            {enrollment.classroomName}
                                        </td>

                                        <td className="px-5 py-4 text-gray-600">
                                            {enrollment.academic_year}
                                        </td>

                                        <td className="px-5 py-4 text-gray-600">
                                            {enrollment.enrollment_date}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enrollment.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : enrollment.status === "completed"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-700"
                                                }`}>
                                                {enrollment.status === "active"
                                                    ? "Activa"
                                                    : enrollment.status === "completed"
                                                        ? "Completada"
                                                        : "Retirada"}
                                            </span>
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
                                                                    Editar matrícula
                                                                </h3>

                                                                <a
                                                                    href="/enrollments"
                                                                    aria-label="Cerrar formulario"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                                                >
                                                                    ✕
                                                                </a>
                                                            </div>

                                                            <form action={updateEnrollment} className="space-y-4">
                                                                <input
                                                                    type="hidden"
                                                                    name="id"
                                                                    value={enrollment.id}
                                                                />

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Estudiante
                                                                    </label>
                                                                    <select
                                                                        name="student_id"
                                                                        defaultValue={enrollment.student_id}
                                                                        className="w-full rounded-lg border p-3"
                                                                        required
                                                                    >
                                                                        {studentOptions.map((student) => (
                                                                            <option key={student.id} value={student.id}>
                                                                                {student.student_code} - {student.first_name} {student.last_name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Aula
                                                                    </label>
                                                                    <select
                                                                        name="classroom_id"
                                                                        defaultValue={enrollment.classroom_id}
                                                                        className="w-full rounded-lg border p-3"
                                                                        required
                                                                    >
                                                                        {classroomOptions.map((classroom) => (
                                                                            <option key={classroom.id} value={classroom.id}>
                                                                                {classroom.grade_level} - {classroom.section} ({classroom.academic_year})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Año académico
                                                                    </label>
                                                                    <input
                                                                        name="academic_year"
                                                                        type="number"
                                                                        min="2000"
                                                                        max="2100"
                                                                        defaultValue={enrollment.academic_year}
                                                                        className="w-full rounded-lg border p-3"
                                                                        required
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Fecha de matrícula
                                                                    </label>
                                                                    <input
                                                                        name="enrollment_date"
                                                                        type="date"
                                                                        defaultValue={enrollment.enrollment_date}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Estado
                                                                    </label>
                                                                    <select
                                                                        name="status"
                                                                        defaultValue={enrollment.status}
                                                                        className="w-full rounded-lg border p-3"
                                                                    >
                                                                        <option value="active">Activa</option>
                                                                        <option value="withdrawn">Retirada</option>
                                                                        <option value="completed">Completada</option>
                                                                    </select>
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

                                                <DeleteEnrollmentButton enrollmentId={enrollment.id} />
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
