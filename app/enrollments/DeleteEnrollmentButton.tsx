
"use client";

import { useState } from "react";
import { deleteEnrollment } from "@/app/enrollments/actions";
import { Trash2 } from "lucide-react";

interface DeleteEnrollmentButtonProps {
    enrollmentId: string;
}

export default function DeleteEnrollmentButton({
    enrollmentId,
}: DeleteEnrollmentButtonProps) {
    const [loading, setLoading] = useState(false);

    return (
        <form
            action={deleteEnrollment}
            onSubmit={(event) => {
                const confirmed = window.confirm(
                    "¿Deseas eliminar esta matrícula? No se podrá eliminar si tiene asistencias o calificaciones registradas."
                );

                if (!confirmed) {
                    event.preventDefault();
                    return;
                }

                setLoading(true);
            }}
        >
            <input type="hidden" name="id" value={enrollmentId} />

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
