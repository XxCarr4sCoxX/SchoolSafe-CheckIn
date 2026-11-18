
"use client";

import { useState } from "react";
import { deleteTeacher } from "@/app/teachers/actions";
import { Trash2 } from "lucide-react";

interface DeleteTeacherButtonProps {
    teacherId: string;
}

export default function DeleteTeacherButton({
    teacherId,
}: DeleteTeacherButtonProps) {
    const [loading, setLoading] = useState(false);

    return (
        <form
            action={deleteTeacher}
            onSubmit={(event) => {
                const confirmed = window.confirm(
                    "¿Estás seguro de eliminar este docente?"
                );

                if (!confirmed) {
                    event.preventDefault();
                    return;
                }

                setLoading(true);
            }}
        >
            <input type="hidden" name="id" value={teacherId} />

            <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
                <Trash2 className="h-4 w-4" />
                {loading ? "Eliminando..." : "Eliminar"}
            </button>
        </form>
    );
}
