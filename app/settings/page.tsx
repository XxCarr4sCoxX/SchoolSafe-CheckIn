

import AdminShell from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function SettingsPage() {
    const { user, profile } = await requireAdmin();

    return (
        <AdminShell>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Configuración
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Información de tu cuenta administrativa.
                </p>
            </div>

            <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-semibold text-gray-800">
                    Perfil del administrador
                </h3>

                <div className="space-y-5">
                    <div>
                        <p className="text-sm text-gray-500">Nombre</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {profile.full_name}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Correo electrónico</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {user.email}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Rol del usuario</p>
                        <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                            Administrador
                        </span>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Fecha de creación del perfil</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {new Date(profile.created_at).toLocaleDateString("es-PE")}
                        </p>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
