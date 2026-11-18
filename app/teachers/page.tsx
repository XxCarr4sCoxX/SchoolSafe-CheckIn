
import AdminShell from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import DeleteTeacherButton from "./DeleteTeacherButton";
import { createTeacher, updateTeacher } from "./actions";
import { Search, UserPlus, BriefcaseBusiness, Edit3 } from "lucide-react";

interface TeachersPageProps {
    searchParams: Promise<{
        q?: string;
        success?: string;
        error?: string;
    }>;
}

const messages: Record<string, string> = {
    created: "Docente registrado correctamente.",
    updated: "Información del docente actualizada.",
    deleted: "Docente eliminado correctamente.",
};

const errors: Record<string, string> = {
    invalid: "Completa correctamente los campos obligatorios.",
    create: "No se pudo registrar. Comprueba que el código no esté duplicado.",
    update: "No se pudo actualizar el docente.",
    delete: "No se pudo eliminar el docente.",
};

export default async function TeachersPage({
    searchParams,
}: TeachersPageProps) {
    const { supabase } = await requireAdmin();
    const params = await searchParams;

    const search = (params.q ?? "").trim().toLocaleLowerCase("es");

    const { data, error } = await supabase
        .from("teachers")
        .select("id, teacher_code, first_name, last_name, email, phone, status, created_at")
        .order("created_at", { ascending: false });

    const allTeachers = data ?? [];

    const teachers = allTeachers.filter((teacher) => {
        const searchable = [
            teacher.teacher_code,
            teacher.first_name,
            teacher.last_name,
            teacher.email ?? "",
            teacher.phone ?? "",
        ].join(" ").toLocaleLowerCase("es");

        return searchable.includes(search);
    });

    return (
        <AdminShell>
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Gestión de docentes
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Registra, consulta y administra el personal docente.
                    </p>
                </div>

                <a
                    href="#formulario-docente"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                    <UserPlus className="h-5 w-5" />
                    Nuevo docente
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
                        ? "No se pudieron consultar los docentes."
                        : errors[params.error ?? ""] ?? "Ha ocurrido un error."}
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total de docentes</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {allTeachers.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                            <BriefcaseBusiness className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Docentes activos</p>
                    <p className="mt-2 text-3xl font-bold text-green-700">
                        {allTeachers.filter((teacher) => teacher.status === "active").length}
                    </p>
                </div>
            </div>

            <section
                id="formulario-docente"
                className="mb-7 scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <UserPlus className="h-5 w-5 text-blue-700" />
                    Registrar nuevo docente
                </h3>

                <form
                    action={createTeacher}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                    <div>
                        <label htmlFor="teacher_code" className="mb-2 block text-sm font-medium text-gray-700">
                            Código del docente *
                        </label>
                        <input
                            id="teacher_code"
                            name="teacher_code"
                            placeholder="DOC-003"
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
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="docente@colegio.edu"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                            Teléfono
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="999 999 999"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800"
                        >
                            Guardar docente
                        </button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Lista de docentes
                        </h3>
                        <p className="text-sm text-gray-500">
                            {teachers.length} registro(s) encontrado(s)
                        </p>
                    </div>

                    <form method="GET" action="/teachers" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                name="q"
                                defaultValue={params.q ?? ""}
                                placeholder="Buscar docente..."
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
                        No fue posible cargar los docentes desde PostgreSQL.
                    </p>
                ) : teachers.length === 0 ? (
                    <p className="p-10 text-center text-gray-500">
                        {search
                            ? "No se encontraron docentes con esa búsqueda."
                            : "Todavía no hay docentes registrados."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Código</th>
                                    <th className="px-5 py-4">Nombres</th>
                                    <th className="px-5 py-4">Apellidos</th>
                                    <th className="px-5 py-4">Correo</th>
                                    <th className="px-5 py-4">Teléfono</th>
                                    <th className="px-5 py-4">Estado</th>
                                    <th className="px-5 py-4">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {teachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-blue-50/40">
                                        <td className="px-5 py-4 font-semibold text-blue-800">
                                            {teacher.teacher_code}
                                        </td>
                                        <td className="px-5 py-4 text-gray-800">
                                            {teacher.first_name}
                                        </td>
                                        <td className="px-5 py-4 text-gray-800">
                                            {teacher.last_name}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {teacher.email ?? "—"}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {teacher.phone ?? "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${teacher.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-700"
                                                }`}>
                                                {teacher.status === "active" ? "Activo" : "Inactivo"}
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
                                                                    Editar docente
                                                                </h3>
                                                                <a
                                                                    href="/teachers"
                                                                    aria-label="Cerrar formulario"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                                                >
                                                                    ✕
                                                                </a>
                                                            </div>

                                                            <form action={updateTeacher} className="space-y-4">
                                                                <input type="hidden" name="id" value={teacher.id} />

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Código</label>
                                                                    <input
                                                                        name="teacher_code"
                                                                        required
                                                                        defaultValue={teacher.teacher_code}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Nombres</label>
                                                                    <input
                                                                        name="first_name"
                                                                        required
                                                                        defaultValue={teacher.first_name}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Apellidos</label>
                                                                    <input
                                                                        name="last_name"
                                                                        required
                                                                        defaultValue={teacher.last_name}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Correo electrónico</label>
                                                                    <input
                                                                        name="email"
                                                                        type="email"
                                                                        defaultValue={teacher.email ?? ""}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Teléfono</label>
                                                                    <input
                                                                        name="phone"
                                                                        type="tel"
                                                                        defaultValue={teacher.phone ?? ""}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">Estado</label>
                                                                    <select
                                                                        name="status"
                                                                        defaultValue={teacher.status}
                                                                        className="w-full rounded-lg border p-3"
                                                                    >
                                                                        <option value="active">Activo</option>
                                                                        <option value="inactive">Inactivo</option>
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

                                                <DeleteTeacherButton teacherId={teacher.id} />
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
