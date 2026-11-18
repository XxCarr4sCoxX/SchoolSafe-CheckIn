
"use client";

import { useState } from "react";
import { deleteGrade } from "@/app/grades/actions";
import { Trash2 } from "lucide-react";

interface DeleteGradeButtonProps {
    gradeId: string;
}

export default function DeleteGradeButton({
    gradeId,
}: DeleteGradeButtonProps) {
    const [loading, setLoading] = useState(false);

    return (
        <form
            action={deleteGrade}
            onSubmit={(event) => {
                const confirmed = window.confirm(
                    "¿Estás seguro de eliminar esta calificación? Esta acción no se puede deshacer."
                );

                if (!confirmed) {
                    event.preventDefault();
                    return;
                }

                setLoading(true);
            }}
        >
            <input type="hidden" name="id" value={gradeId} />

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
