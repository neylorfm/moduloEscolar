import { getHorarios } from "@/app/actions/horarios";
import { HorariosClient } from "@/components/settings/horarios/horarios-client";

export default async function HorariosPage() {
    const { data: horarios, error } = await getHorarios();

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                <h3 className="font-semibold">Erro ao carregar horários</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                    Grade de Horários
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                    Crie e gerencie os períodos de aula, intervalos e refeições da escola.
                </p>
            </div>

            <HorariosClient initialHorarios={horarios || []} />
        </div>
    );
}
