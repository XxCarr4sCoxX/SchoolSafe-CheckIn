import AdminShell from "../../components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import DeleteClassroomButton from "./DeleteClassroomButton";
import { createClassroom, updateClassroom } from "./actions";
import {
    Search,
    School,
    UserPlus,
    Edit3,
    Users,
} from "lucide-react";

interface ClassroomsPageProps {
    searchParams: Promise<{
        q?: string;
        success?: string;
        error?: string;
    }>;
}

const messages: Record<string, string> = {
    created: "Aula registrada correctamente.",
    updated: "Aula actualizada correctamente.",
    deleted: "Aula eliminada correctamente.",
};

const errors: Record<string, string> = {
    invalid: "Verifica los datos ingresados.",
    duplicate: "Esta aula ya existe para ese grado, sección y año académico.",
    create: "No se pudo registrar el aula.",
    update: "No se pudo actualizar el aula.",
    delete: "No se pudo eliminar. Comprueba si tiene matrículas asociadas.",
};

export default async function ClassroomsPage({
    searchParams,
}: ClassroomsPageProps) {
    const { supabase } = await requireAdmin();
    const params = await searchParams;

    const search = (params.q ?? "").trim().toLocaleLowerCase("es");

    const { data, error } = await supabase
        .from("classrooms")
        .select("id, grade_level, section, academic_year, capacity, created_at")
        .order("academic_year", { ascending: false });

    const allClassrooms = data ?? [];

    const classrooms = allClassrooms.filter((classroom) => {
        const searchable = [
            classroom.grade_level,
            classroom.section,
            String(classroom.academic_year),
        ].join(" ").toLocaleLowerCase("es");

        return searchable.includes(search);
    });

    return (
        <AdminShell>
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Gestión de aulas
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra los grados, secciones y capacidades del colegio.
                    </p>
                </div>

                <a
                    href="#formulario-aula"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                    <UserPlus className="h-5 w-5" />
                    Nueva aula
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
                        ? "No se pudieron consultar las aulas."
                        : errors[params.error ?? ""] ?? "Ha ocurrido un error."}
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total de aulas</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {allClassrooms.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                            <School className="h-7 w-7" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Capacidad total</p>
                            <p className="mt-2 text-3xl font-bold text-green-700">
                                {allClassrooms.reduce(
                                    (total, classroom) => total + classroom.capacity,
                                    0
                                )}
                            </p>
                        </div>
                        <div className="rounded-xl bg-green-50 p-3 text-green-700">
                            <Users className="h-7 w-7" />
                        </div>
                    </div>
                </div>
            </div>

            <section
                id="formulario-aula"
                className="mb-7 scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <School className="h-5 w-5 text-blue-700" />
                    Registrar nueva aula
                </h3>

                <form
                    action={createClassroom}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
                >
                    <div>
                        <label htmlFor="grade_level" className="mb-2 block text-sm font-medium text-gray-700">
                            Grado *
                        </label>
                        <input
                            id="grade_level"
                            name="grade_level"
                            placeholder="Ej. 1° Secundaria"
                            required
                            maxLength={80}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="section" className="mb-2 block text-sm font-medium text-gray-700">
                            Sección *
                        </label>
                        <input
                            id="section"
                            name="section"
                            placeholder="Ej. A"
                            required
                            maxLength={20}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
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
                            defaultValue={2026}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="capacity" className="mb-2 block text-sm font-medium text-gray-700">
                            Capacidad *
                        </label>
                        <input
                            id="capacity"
                            name="capacity"
                            type="number"
                            min="1"
                            defaultValue={30}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="md:col-span-2 lg:col-span-4">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800"
                        >
                            Guardar aula
                        </button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Lista de aulas
                        </h3>
                        <p className="text-sm text-gray-500">
                            {classrooms.length} registro(s) encontrado(s)
                        </p>
                    </div>

                    <form method="GET" action="/classrooms" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                name="q"
                                defaultValue={params.q ?? ""}
                                placeholder="Buscar grado o sección..."
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
                        No fue posible cargar las aulas desde PostgreSQL.
                    </p>
                ) : classrooms.length === 0 ? (
                    <p className="p-10 text-center text-gray-500">
                        {search
                            ? "No se encontraron aulas con esa búsqueda."
                            : "Todavía no hay aulas registradas."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Grado</th>
                                    <th className="px-5 py-4">Sección</th>
                                    <th className="px-5 py-4">Año académico</th>
                                    <th className="px-5 py-4">Capacidad</th>
                                    <th className="px-5 py-4">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {classrooms.map((classroom) => (
                                    <tr key={classroom.id} className="hover:bg-blue-50/40">
                                        <td className="px-5 py-4 font-semibold text-gray-900">
                                            {classroom.grade_level}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                                                {classroom.section}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {classroom.academic_year}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {classroom.capacity} estudiantes
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
                                                                    Editar aula
                                                                </h3>

                                                                <a
                                                                    href="/classrooms"
                                                                    aria-label="Cerrar formulario"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                                                >
                                                                    ✕
                                                                </a>
                                                            </div>

                                                            <form action={updateClassroom} className="space-y-4">
                                                                <input
                                                                    type="hidden"
                                                                    name="id"
                                                                    value={classroom.id}
                                                                />

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Grado
                                                                    </label>
                                                                    <input
                                                                        name="grade_level"
                                                                        required
                                                                        defaultValue={classroom.grade_level}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Sección
                                                                    </label>
                                                                    <input
                                                                        name="section"
                                                                        required
                                                                        defaultValue={classroom.section}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
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
                                                                        required
                                                                        defaultValue={classroom.academic_year}
                                                                        className="w-full rounded-lg border p-3"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Capacidad
                                                                    </label>
                                                                    <input
                                                                        name="capacity"
                                                                        type="number"
                                                                        min="1"
                                                                        required
                                                                        defaultValue={classroom.capacity}
                                                                        className="w-full rounded-lg border p-3"
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

                                                <DeleteClassroomButton classroomId={classroom.id} />
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
