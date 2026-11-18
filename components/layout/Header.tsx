
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Panel principal",
  "/students": "Gestión de estudiantes",
  "/teachers": "Gestión de docentes",
  "/classrooms": "Gestión de aulas",
  "/enrollments": "Matrículas escolares",
  "/attendance": "Control de asistencia",
  "/grades": "Calificaciones",
  "/subjects": "Cursos y asignaturas",
  "/settings": "Configuración",
};

export default function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "EduSchool";

  return (
    <header className="flex min-h-20 items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          EduSchool / Administración
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-800">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Inicio</span>
        </Link>

        <div className="rounded-full bg-blue-50 p-2 text-blue-700">
          <Bell className="h-5 w-5" />
        </div>

        <div className="hidden rounded-full bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-900 sm:block">
          Administrador
        </div>
      </div>
    </header>
  );
}
