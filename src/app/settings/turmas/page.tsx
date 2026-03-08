import { getTurmas } from "@/app/actions/turmas";
import { TurmasClient } from "@/components/settings/turmas/turmas-client";

export const metadata = {
    title: "Turmas - Módulo Escolar",
    description: "Configurações das turmas",
};

export default async function TurmasPage() {
    // Fetch data server-side
    const { data: turmas, error } = await getTurmas();

    if (error) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-6">
                    Turmas
                </h2>
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    Erro ao carregar dados: {error}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                    Turmas
                </h2>
                <p className="text-slate-500 dark:text-zinc-400 mt-1">
                    Gerencie as séries e os nomes das turmas
                </p>
            </div>

            <TurmasClient initialTurmas={turmas || []} />
        </div>
    );
}
