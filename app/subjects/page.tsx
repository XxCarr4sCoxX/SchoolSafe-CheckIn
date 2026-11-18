
import AdminShell from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import DeleteSubjectButton from "./DeleteSubjectButton";
import { createSubject, updateSubject } from "./actions";
import {
    Search,
    Library,
    UserPlus,
    Edit3,
    BookOpen,
} from "lucide-react";

interface SubjectsPageProps {
    searchParams: Promise<{
        q?: string;
        success?: string;
        error?: string;
    }>;
}

const messages: Record<string, string> = {
    created: "Asignatura registrada correctamente.",
    updated: "Asignatura actualizada correctamente.",
    deleted: "Asignatura eliminada correctamente.",
};

const errors: Record<string, string> = {
    invalid: "Completa correctamente los campos solicitados.",
    duplicate: "El código o nombre de esta asignatura ya existe.",
    create: "No se pudo registrar la asignatura.",
    update: "No se pudo actualizar la asignatura.",
    delete: "No se pudo eliminar la asignatura.",
    related: "No se puede eliminar porque esta asignatura tiene calificaciones relacionadas.",
};

export default async function SubjectsPage({
    searchParams,
}: SubjectsPageProps) {
    const { supabase } = await requireAdmin();
    const params = await searchParams;

    const search = (params.q ?? "").trim().toLocaleLowerCase("es");

    const { data, error } = await supabase
        .from("subjects")
        .select("id, subject_code, name, description, created_at")
        .order("name", { ascending: true });

    const allSubjects = data ?? [];

    const subjects = allSubjects.filter((subject) => {
        const searchable = [
            subject.subject_code,
            subject.name,
            subject.description ?? "",
        ]
            .join(" ")
            .toLocaleLowerCase("es");

        return searchable.includes(search);
    });

    return (
        <AdminShell>
            {/* ENCABEZADO */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Gestión de cursos y asignaturas
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Administra las materias y asignaturas del colegio.
                    </p>
                </div>

                <a
                    href="#formulario-asignatura"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                    <UserPlus className="h-5 w-5" />
                    Nueva asignatura
                </a>
            </div>

            {/* MENSAJES */}
            {params.success && messages[params.success] && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    {messages[params.success]}
                </div>
            )}

            {(error || params.error) && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {error
                        ? `Error al consultar asignaturas: ${error.message}`
                        : errors[params.error ?? ""] ?? "Ha ocurrido un error."}
                </div>
            )}

            {/* TARJETAS */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Total de asignaturas
                            </p>

                            <p className="mt-2 text-3xl font-bold text-blue-700">
                                {allSubjects.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                            <Library className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Cursos encontrados
                            </p>

                            <p className="mt-2 text-3xl font-bold text-green-700">
                                {subjects.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-green-50 p-3 text-green-700">
                            <BookOpen className="h-7 w-7" />
                        </div>
                    </div>
                </div>
            </div>

            {/* FORMULARIO DE REGISTRO */}
            <section
                id="formulario-asignatura"
                className="mb-7 scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <UserPlus className="h-5 w-5 text-blue-700" />
                    Registrar nueva asignatura
                </h3>

                <form
                    action={createSubject}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <div>
                        <label
                            htmlFor="subject_code"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Código de asignatura *
                        </label>

                        <input
                            id="subject_code"
                            name="subject_code"
                            placeholder="Ej. MAT"
                            maxLength={30}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Nombre de la asignatura *
                        </label>

                        <input
                            id="name"
                            name="name"
                            placeholder="Ej. Matemáticas"
                            maxLength={120}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label
                            htmlFor="description"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Descripción
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            maxLength={500}
                            placeholder="Describe brevemente el contenido de esta asignatura..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800"
                        >
                            Guardar asignatura
                        </button>
                    </div>
                </form>
            </section>

            {/* LISTADO */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Lista de asignaturas
                        </h3>

                        <p className="text-sm text-gray-500">
                            {subjects.length} registro(s) encontrado(s)
                        </p>
                    </div>

                    <form method="GET" action="/subjects" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                                type="search"
                                name="q"
                                defaultValue={params.q ?? ""}
                                placeholder="Buscar asignatura..."
                                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-600 sm:w-64"
                            />
                        </div>

                        <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
                            Buscar
                        </button>
                    </form>
                </div>

                {error ? (
                    <p className="p-8 text-center text-red-600">
                        No fue posible cargar las asignaturas desde PostgreSQL.
                    </p>
                ) : subjects.length === 0 ? (
                    <p className="p-10 text-center text-gray-500">
                        {search
                            ? "No se encontraron asignaturas con esa búsqueda."
                            : "Todavía no hay asignaturas registradas."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Código</th>
                                    <th className="px-5 py-4">Asignatura</th>
                                    <th className="px-5 py-4">Descripción</th>
                                    <th className="px-5 py-4">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {subjects.map((subject) => (
                                    <tr key={subject.id} className="hover:bg-blue-50/40">
                                        <td className="px-5 py-4 font-semibold text-blue-800">
                                            {subject.subject_code}
                                        </td>

                                        <td className="px-5 py-4 font-medium text-gray-800">
                                            {subject.name}
                                        </td>

                                        <td className="max-w-[350px] px-5 py-4 text-gray-600">
                                            {subject.description ?? "Sin descripción"}
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
                                                                    Editar asignatura
                                                                </h3>

                                                                <a
                                                                    href="/subjects"
                                                                    aria-label="Cerrar formulario"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                                                >
                                                                    ✕
                                                                </a>
                                                            </div>

                                                            <form action={updateSubject} className="space-y-4">
                                                                <input
                                                                    type="hidden"
                                                                    name="id"
                                                                    value={subject.id}
                                                                />

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Código
                                                                    </label>

                                                                    <input
                                                                        name="subject_code"
                                                                        required
                                                                        maxLength={30}
                                                                        defaultValue={subject.subject_code}
                                                                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Nombre
                                                                    </label>

                                                                    <input
                                                                        name="name"
                                                                        required
                                                                        maxLength={120}
                                                                        defaultValue={subject.name}
                                                                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                                        Descripción
                                                                    </label>

                                                                    <textarea
                                                                        name="description"
                                                                        rows={3}
                                                                        maxLength={500}
                                                                        defaultValue={subject.description ?? ""}
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

                                                <DeleteSubjectButton subjectId={subject.id} />
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
