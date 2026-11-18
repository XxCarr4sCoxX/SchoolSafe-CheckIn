
import AdminShell from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import DeleteStudentButton from "./DeleteStudentButton";
import { createStudent, updateStudent } from "./actions";
import { Search, UserPlus, Users, Edit3 } from "lucide-react";

interface StudentsPageProps {
    searchParams: Promise<{
        q?: string;
        success?: string;
        error?: string;
    }>;
}

const messages: Record<string, string> = {
    created: "Estudiante registrado correctamente.",
    updated: "Información del estudiante actualizada.",
    deleted: "Estudiante eliminado correctamente.",
};

const errors: Record<string, string> = {
    invalid: "Completa correctamente los campos obligatorios.",
    create: "No se pudo registrar. Comprueba que el código no esté duplicado.",
    update: "No se pudo actualizar el estudiante.",
    delete: "No se pudo eliminar. Comprueba si tiene matrículas relacionadas.",
};

export default async function StudentsPage({
    searchParams,
}: StudentsPageProps) {
    const { supabase } = await requireAdmin();
    const params = await searchParams;

    const search = (params.q ?? "").trim().toLocaleLowerCase("es");

    const { data, error } = await supabase
        .from("students")
        .select(
            "id, student_code, first_name, last_name, birth_date, status, created_at"
        )
        .order("created_at", { ascending: false });

    const allStudents = data ?? [];

    const students = allStudents.filter((student) => {
        const searchable = [
            student.student_code,
            student.first_name,
            student.last_name,
        ].join(" ").toLocaleLowerCase("es");

        return searchable.includes(search);
    });

    return (
        <AdminShell>
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Gestión de estudiantes
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Registra, consulta y administra los estudiantes del colegio.
                    </p>
                </div>

                <a
                    href="#formulario-estudiante"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                    <UserPlus className="h-5 w-5" />
                    Nuevo estudiante
                </a>
            </div>

            {params.success && messages[params.success] && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    {messages[params.success]}
                </div>
            )}

            {(error || params.error) && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {error
                        ? "No se pudieron consultar los estudiantes."
                        : errors[params.error ?? ""] ?? "Ha ocurrido un error."}
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total de estudiantes</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {allStudents.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                            <Users className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Estudiantes activos</p>
                    <p className="mt-2 text-3xl font-bold text-green-700">
                        {allStudents.filter((student) => student.status === "active").length}
                    </p>
                </div>
            </div>

            <section
                id="formulario-estudiante"
                className="mb-7 scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <UserPlus className="h-5 w-5 text-blue-700" />
                    Registrar nuevo estudiante
                </h3>

                <form action={createStudent} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label htmlFor="student_code" className="mb-2 block text-sm font-medium text-gray-700">
                            Código del estudiante *
                        </label>
                        <input
                            id="student_code"
                            name="student_code"
                            placeholder="EST-006"
                            required
                            maxLength={30}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="first_name" className="mb-2 block text-sm font-medium text-gray-700">
                            Nombres *
                        </label>
                        <input
                            id="first_name"
                            name="first_name"
                            placeholder="Nombres"
                            required
                            maxLength={100}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="last_name" className="mb-2 block text-sm font-medium text-gray-700">
                            Apellidos *
                        </label>
                        <input
                            id="last_name"
                            name="last_name"
                            placeholder="Apellidos"
                            required
                            maxLength={100}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="birth_date" className="mb-2 block text-sm font-medium text-gray-700">
                            Fecha de nacimiento
                        </label>
                        <input
                            id="birth_date"
                            name="birth_date"
                            type="date"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="md:col-span-2 lg:col-span-4">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800"
                        >
                            Guardar estudiante
                        </button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Lista de estudiantes
                        </h3>
                        <p className="text-sm text-gray-500">
                            {students.length} registro(s) encontrado(s)
                        </p>
                    </div>

                    <form method="GET" action="/students" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                name="q"
                                defaultValue={params.q ?? ""}
                                placeholder="Buscar estudiante..."
                                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 sm:w-64"
                            />
                        </div>
                        <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
                            Buscar
                        </button>
                    </form>
                </div>

                {error ? (
                    <p className="p-8 text-center text-red-600">
                        No fue posible cargar la información desde PostgreSQL.
                    </p>
                ) : students.length === 0 ? (
                    <p className="p-10 text-center text-gray-500">
                        {search
                            ? "No se encontraron estudiantes con esa búsqueda."
                            : "Todavía no hay estudiantes registrados."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Código</th>
                                    <th className="px-5 py-4">Nombres</th>
                                    <th className="px-5 py-4">Apellidos</th>
                                    <th className="px-5 py-4">Nacimiento</th>
                                    <th className="px-5 py-4">Estado</th>
                                    <th className="px-5 py-4">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-blue-50/40">
                                        <td className="px-5 py-4 font-semibold text-blue-800">
                                            {student.student_code}
                                        </td>
                                        <td className="px-5 py-4 text-gray-800">
                                            {student.first_name}
                                        </td>
                                        <td className="px-5 py-4 text-gray-800">
                                            {student.last_name}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {student.birth_date ?? "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : student.status === "graduated"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-700"
                                                }`}>
                                                {student.status === "active"
                                                    ? "Activo"
                                                    : student.status === "graduated"
                                                        ? "Graduado"
                                                        : "Inactivo"}
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
                                                                    Editar estudiante
                                                                </h3>
                                                                <a
                                                                    href="/students"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                                    aria-label="Cerrar formulario"
                                                                >
                                                                    ✕
                                                                </a>
                                                            </div>

                                                            <form action={updateStudent} className="space-y-4">
                                                                <input type="hidden" name="id" value={student.id} />

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Código</label>
                                                                    <input
                                                                        name="student_code"
                                                                        required
                                                                        defaultValue={student.student_code}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Nombres</label>
                                                                    <input
                                                                        name="first_name"
                                                                        required
                                                                        defaultValue={student.first_name}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Apellidos</label>
                                                                    <input
                                                                        name="last_name"
                                                                        required
                                                                        defaultValue={student.last_name}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Nacimiento</label>
                                                                    <input
                                                                        name="birth_date"
                                                                        type="date"
                                                                        defaultValue={student.birth_date ?? ""}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Estado</label>
                                                                    <select
                                                                        name="status"
                                                                        defaultValue={student.status}
                                                                        className="w-full rounded-lg border p-3"
                                                                    >
                                                                        <option value="active">Activo</option>
                                                                        <option value="inactive">Inactivo</option>
                                                                        <option value="graduated">Graduado</option>
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

                                                <DeleteStudentButton studentId={student.id} />
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
