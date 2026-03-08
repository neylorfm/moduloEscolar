import { getAreas, getProfessores } from "@/app/actions/areas";
import { AreasClient } from "@/components/settings/areas/areas-client";

export const metadata = {
    title: "Áreas - Módulo Escolar",
    description: "Configurações das áreas e disciplinas",
};

export default async function AreasPage() {
    // Fetch data server-side
    const { data: areas, error: areasError } = await getAreas();
    const { data: professores, error: profError } = await getProfessores();

    if (areasError || profError) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-6">
                    Áreas
                </h2>
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    Erro ao carregar dados: {areasError || profError}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                    Áreas
                </h2>
                <p className="text-slate-500 dark:text-zinc-400 mt-1">
                    Gerencie as áreas, discplinas e coordenadores (PCAs)
                </p>
            </div>

            <AreasClient
                initialAreas={areas || []}
                professores={professores || []}
            />
        </div>
    );
}
