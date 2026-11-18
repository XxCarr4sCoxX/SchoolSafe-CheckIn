
import AdminShell from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import DeleteAttendanceButton from "./DeleteAttendanceButton";
import { createAttendance, updateAttendance } from "./actions";
import {
    Search,
    CalendarCheck,
    UserPlus,
    Edit3,
    CheckCircle2,
    XCircle,
    Clock,
    FileCheck,
} from "lucide-react";

interface AttendancePageProps {
    searchParams: Promise<{
        q?: string;
        success?: string;
        error?: string;
    }>;
}

const statusLabels: Record<string, string> = {
    present: "Presente",
    absent: "Ausente",
    late: "Tardanza",
    excused: "Justificado",
};

const statusStyles: Record<string, string> = {
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
    late: "bg-yellow-100 text-yellow-800",
    excused: "bg-blue-100 text-blue-800",
};

const messages: Record<string, string> = {
    created: "Asistencia registrada correctamente.",
    updated: "Registro de asistencia actualizado.",
    deleted: "Registro de asistencia eliminado.",
};

const errors: Record<string, string> = {
    invalid: "Completa correctamente todos los campos.",
    enrollment: "La matrícula seleccionada no existe o no está disponible.",
    duplicate: "Esta matrícula ya tiene una asistencia registrada para esa fecha.",
    create: "No se pudo registrar la asistencia.",
    update: "No se pudo actualizar el registro.",
    delete: "No se pudo eliminar el registro.",
};


export default async function AttendancePage({
    searchParams,
}: AttendancePageProps) {
    const { supabase } = await requireAdmin();
    const params = await searchParams;

    const search = (params.q ?? "").trim().toLocaleLowerCase("es");

    const [
        { data: attendanceData, error: attendanceError },
        { data: enrollmentData, error: enrollmentError },
        { data: studentData, error: studentError },
        { data: classroomData, error: classroomError },
    ] = await Promise.all([
        supabase
            .from("attendance")
            .select("id, enrollment_id, attendance_date, status, notes, created_at")
            .order("attendance_date", { ascending: false }),

        supabase
            .from("enrollments")
            .select("id, student_id, classroom_id, academic_year, status"),

        supabase
            .from("students")
            .select("id, student_code, first_name, last_name, status"),

        supabase
            .from("classrooms")
            .select("id, grade_level, section, academic_year, capacity"),
    ]);

    const queryError =
        attendanceError ||
        enrollmentError ||
        studentError ||
        classroomError;

    const allEnrollments = enrollmentData ?? [];
    const students = studentData ?? [];
    const classrooms = classroomData ?? [];

    const enrollmentMap = new Map(
        allEnrollments.map((enrollment) => [enrollment.id, enrollment])
    );

    const studentMap = new Map(
        students.map((student) => [student.id, student])
    );

    const classroomMap = new Map(
        classrooms.map((classroom) => [classroom.id, classroom])
    );

    const allRecords = (attendanceData ?? []).map((record) => {
        const enrollment = enrollmentMap.get(record.enrollment_id);

        const student = enrollment
            ? studentMap.get(enrollment.student_id)
            : undefined;

        const classroom = enrollment
            ? classroomMap.get(enrollment.classroom_id)
            : undefined;

        return {
            ...record,
            studentName: student
                ? `${student.first_name} ${student.last_name}`
                : "Estudiante no disponible",
            studentCode: student?.student_code ?? "—",
            classroomName: classroom
                ? `${classroom.grade_level} - ${classroom.section}`
                : "Aula no disponible",
            academicYear: enrollment?.academic_year ?? "—",
        };
    });

    const records = allRecords.filter((record) => {
        const searchable = [
            record.studentName,
            record.studentCode,
            record.classroomName,
            record.attendance_date,
            statusLabels[record.status] ?? record.status,
            record.notes ?? "",
        ]
            .join(" ")
            .toLocaleLowerCase("es");

        return searchable.includes(search);
    });

    const activeEnrollments = allEnrollments.filter((enrollment) => {
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

    const presentCount = allRecords.filter(
        (record) => record.status === "present"
    ).length;

    const absentCount = allRecords.filter(
        (record) => record.status === "absent"
    ).length;

    const lateCount = allRecords.filter(
        (record) => record.status === "late"
    ).length;

    const excusedCount = allRecords.filter(
        (record) => record.status === "excused"
    ).length;

    return (
        <AdminShell>
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Control de asistencia
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Registra y administra las asistencias de los estudiantes.
                    </p>
                </div>

                <a
                    href="#formulario-asistencia"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                    <UserPlus className="h-5 w-5" />
                    Registrar asistencia
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
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Presentes</p>
                            <p className="mt-2 text-3xl font-bold text-green-700">
                                {presentCount}
                            </p>
                        </div>
                        <div className="rounded-xl bg-green-50 p-3 text-green-700">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Ausentes</p>
                            <p className="mt-2 text-3xl font-bold text-red-700">
                                {absentCount}
                            </p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-3 text-red-700">
                            <XCircle className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Tardanzas</p>
                            <p className="mt-2 text-3xl font-bold text-yellow-700">
                                {lateCount}
                            </p>
                        </div>
                        <div className="rounded-xl bg-yellow-50 p-3 text-yellow-700">
                            <Clock className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Justificados</p>
                            <p className="mt-2 text-3xl font-bold text-blue-700">
                                {excusedCount}
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                            <FileCheck className="h-7 w-7" />
                        </div>
                    </div>
                </div>
            </div>

            {/* REGISTRAR ASISTENCIA */}
            <section
                id="formulario-asistencia"
                className="mb-7 scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <CalendarCheck className="h-5 w-5 text-blue-700" />
                    Registrar nueva asistencia
                </h3>

                {activeEnrollments.length === 0 ? (
                    <p className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                        Necesitas tener al menos una matrícula activa para registrar
                        asistencias.
                    </p>
                ) : (
                    <form
                        action={createAttendance}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
                    >
                        <div className="md:col-span-2">
                            <label
                                htmlFor="enrollment_id"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Estudiante y aula *
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
                                    const classroom = classroomMap.get(enrollment.classroom_id);

                                    return (
                                        <option
                                            key={enrollment.id}
                                            value={enrollment.id}
                                        >
                                            {student?.student_code} - {student?.first_name}{" "}
                                            {student?.last_name} | {classroom?.grade_level} -{" "}
                                            {classroom?.section} | {enrollment.academic_year}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="attendance_date"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Fecha de asistencia *
                            </label>

                            <input
                                id="attendance_date"
                                name="attendance_date"
                                type="date"
                                defaultValue={today}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="status"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Estado *
                            </label>

                            <select
                                id="status"
                                name="status"
                                defaultValue="present"
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900"
                            >
                                <option value="present">Presente</option>
                                <option value="absent">Ausente</option>
                                <option value="late">Tardanza</option>
                                <option value="excused">Justificado</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 lg:col-span-4">
                            <label
                                htmlFor="notes"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Observaciones
                            </label>

                            <textarea
                                id="notes"
                                name="notes"
                                rows={2}
                                maxLength={500}
                                placeholder="Observaciones opcionales..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-4">
                            <button
                                type="submit"
                                className="rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800"
                            >
                                Guardar asistencia
                            </button>
                        </div>
                    </form>
                )}
            </section>

            {/* LISTADO DE ASISTENCIAS */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Historial de asistencia
                        </h3>

                        <p className="text-sm text-gray-500">
                            {records.length} registro(s) encontrado(s)
                        </p>
                    </div>

                    <form method="GET" action="/attendance" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                                type="search"
                                name="q"
                                defaultValue={params.q ?? ""}
                                placeholder="Buscar estudiante..."
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
                        No fue posible cargar los registros de asistencia.
                    </p>
                ) : records.length === 0 ? (
                    <p className="p-10 text-center text-gray-500">
                        {search
                            ? "No se encontraron registros con esa búsqueda."
                            : "Todavía no existen registros de asistencia."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Estudiante</th>
                                    <th className="px-5 py-4">Código</th>
                                    <th className="px-5 py-4">Aula</th>
                                    <th className="px-5 py-4">Fecha</th>
                                    <th className="px-5 py-4">Estado</th>
                                    <th className="px-5 py-4">Observaciones</th>
                                    <th className="px-5 py-4">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-blue-50/40">
                                        <td className="px-5 py-4 font-medium text-gray-800">
                                            {record.studentName}
                                        </td>

                                        <td className="px-5 py-4 text-blue-800">
                                            {record.studentCode}
                                        </td>

                                        <td className="px-5 py-4 text-gray-600">
                                            {record.classroomName}
                                        </td>

                                        <td className="px-5 py-4 text-gray-600">
                                            {new Date(
                                                `${record.attendance_date}T00:00:00`
                                            ).toLocaleDateString("es-PE")}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[record.status] ??
                                                    "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {statusLabels[record.status] ?? record.status}
                                            </span>
                                        </td>

                                        <td className="max-w-[180px] truncate px-5 py-4 text-gray-600">
                                            {record.notes ?? "—"}
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
                                                                    Editar asistencia
                                                                </h3>

                                                                <a
                                                                    href="/attendance"
                                                                    aria-label="Cerrar formulario"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                                                >
                                                                    ✕
                                                                </a>
                                                            </div>

                                                            <form
                                                                action={updateAttendance}
                                                                className="space-y-4"
                                                            >
                                                                <input
                                                                    type="hidden"
                                                                    name="id"
                                                                    value={record.id}
                                                                />

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Estudiante y matrícula
                                                                    </label>

                                                                    <select
                                                                        name="enrollment_id"
                                                                        defaultValue={record.enrollment_id}
                                                                        required
                                                                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                                                                    >
                                                                        {allEnrollments.map((enrollment) => {
                                                                            const student = studentMap.get(enrollment.student_id);
                                                                            const classroom = classroomMap.get(enrollment.classroom_id);

                                                                            return (
                                                                                <option
                                                                                    key={enrollment.id}
                                                                                    value={enrollment.id}
                                                                                >
                                                                                    {student?.student_code} - {student?.first_name}{" "}
                                                                                    {student?.last_name} | {classroom?.grade_level}{" "}
                                                                                    {classroom?.section} | {enrollment.academic_year}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Fecha
                                                                    </label>

                                                                    <input
                                                                        name="attendance_date"
                                                                        type="date"
                                                                        required
                                                                        defaultValue={record.attendance_date}
                                                                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Estado
                                                                    </label>

                                                                    <select
                                                                        name="status"
                                                                        defaultValue={record.status}
                                                                        required
                                                                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                                                                    >
                                                                        <option value="present">Presente</option>
                                                                        <option value="absent">Ausente</option>
                                                                        <option value="late">Tardanza</option>
                                                                        <option value="excused">Justificado</option>
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Observaciones
                                                                    </label>

                                                                    <textarea
                                                                        name="notes"
                                                                        rows={3}
                                                                        maxLength={500}
                                                                        defaultValue={record.notes ?? ""}
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

                                                <DeleteAttendanceButton attendanceId={record.id} />
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
