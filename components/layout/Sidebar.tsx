
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  School,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  Library,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Estudiantes", href: "/students", icon: Users },
  { name: "Docentes", href: "/teachers", icon: BriefcaseBusiness },
  { name: "Aulas", href: "/classrooms", icon: School },
  { name: "Matrículas", href: "/enrollments", icon: ClipboardList },
  { name: "Asistencia", href: "/attendance", icon: CalendarCheck },
  { name: "Calificaciones", href: "/grades", icon: BookOpen },
  { name: "Cursos", href: "/subjects", icon: Library },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 bg-[#172554] text-white md:min-h-screen md:w-64">
      <div className="border-b border-blue-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <School className="h-8 w-8 text-blue-300" />
          <div>
            <h2 className="text-2xl font-bold">EduSchool</h2>
            <p className="text-xs text-blue-200">Sistema de gestión escolar</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${active
                  ? "bg-blue-600 text-white shadow"
                  : "text-blue-100 hover:bg-blue-900 hover:text-white"
                }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-blue-800 p-5">
        <p className="text-xs text-blue-300">
          EduSchool © 2026
        </p>
        <p className="mt-1 text-xs text-blue-400">
          Administración escolar
        </p>
      </div>
    </aside>
  );
}
