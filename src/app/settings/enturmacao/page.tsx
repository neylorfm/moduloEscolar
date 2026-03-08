import { getTurmas } from "@/app/actions/turmas";
import { getAreas } from "@/app/actions/areas";
import { getProfessores } from "@/app/actions/areas";
import { getHorarios } from "@/app/actions/horarios";
import { EnturmacaoClient } from "@/components/settings/enturmacao/enturmacao-client";
import { CsvImportDialog } from "@/components/settings/enturmacao/csv-import-dialog";

export const metadata = {
    title: "Enturmação - Módulo Escolar",
    description: "Vínculo de professores às disciplinas nas turmas",
};

export default async function EnturmacaoPage() {
    // Fetch data server-side
    const [turmasRes, areasRes, professoresRes, horariosRes] = await Promise.all([
        getTurmas(),
        getAreas(),
        getProfessores(),
        getHorarios()
    ]);

    const turmas = turmasRes.data || [];
    const areas = areasRes.data || [];
    const professores = professoresRes.data || [];
    // Only pass Class schedules
    const horarios = (horariosRes.data || []).filter(h => h.tipo === 'Aula');

    const hasErrors = turmasRes.error || areasRes.error || professoresRes.error || horariosRes.error;

    if (hasErrors) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-6">
                    Enturmação
                </h2>
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    Erro ao carregar dados.
                    {turmasRes.error && <div>Turmas: {turmasRes.error}</div>}
                    {areasRes.error && <div>Áreas: {areasRes.error}</div>}
                    {professoresRes.error && <div>Professores: {professoresRes.error}</div>}
                    {horariosRes.error && <div>Horários: {horariosRes.error}</div>}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                        Enturmação
                    </h2>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1">
                        Vincule os professores aos seus horários e disciplinas.
                    </p>
                </div>
                <div>
                    <CsvImportDialog />
                </div>
            </div>

            <EnturmacaoClient
                turmas={turmas}
                areas={areas}
                professores={professores}
                horarios={horarios}
            />
        </div>
    );
}
