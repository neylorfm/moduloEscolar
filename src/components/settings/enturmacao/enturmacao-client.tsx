"use client";

import { useState, useEffect } from "react";
import { Turma } from "@/app/actions/turmas";
import { AreaWithDetails } from "@/app/actions/areas";
import { getAllEnturmacoes, saveEnturmacaoSchedules, deleteEnturmacao, Enturmacao, EnturmacaoHorario } from "@/app/actions/enturmacoes";
import { Horario } from "@/app/actions/horarios";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Calendar, Check, X } from "lucide-react";

interface Professores {
    id: string;
    nome: string;
}

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export function EnturmacaoClient({
    turmas,
    areas,
    professores,
    horarios
}: {
    turmas: Turma[],
    areas: AreaWithDetails[],
    professores: Professores[],
    horarios: Horario[]
}) {
    const [selectedProfessorId, setSelectedProfessorId] = useState<string>("");

    const [todasEnturmacoes, setTodasEnturmacoes] = useState<Enturmacao[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Track local schedule assignments before saving
    // key is "turmaId_disciplinaId", value is Array of { dia_semana, horario_id }
    const [localAssignments, setLocalAssignments] = useState<Record<string, { dia_semana: string, horario_id: number }[]>>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [error, setError] = useState("");

    // Modal state
    const [scheduleContext, setScheduleContext] = useState<{ turmaId: number, disciplinaId: number, turmaNome: string, disciplinaNome: string } | null>(null);

    const fetchEnturmacoes = async () => {
        setLoadingData(true);
        setError("");
        const res = await getAllEnturmacoes();
        if (res.error) {
            setError(res.error);
        } else if (res.data) {
            setTodasEnturmacoes(res.data);
            setLocalAssignments({}); // Reset local changes on reload
        }
        setLoadingData(false);
    };

    // Load ALL enturmacoes on mount
    useEffect(() => {
        fetchEnturmacoes();
    }, []);

    // When professor changes, clear un-saved local toggles and exit edit mode
    useEffect(() => {
        if (selectedProfessorId !== "") {
            setLocalAssignments({});
            setIsEditMode(false);
        }
    }, [selectedProfessorId]);

    const getDBAssignedSchedules = (turmaId: number, disciplinaId: number): EnturmacaoHorario[] => {
        const enturmacao = todasEnturmacoes.find(e => e.turma_id === turmaId && e.disciplina_id === disciplinaId && e.usuario_id === selectedProfessorId);
        return enturmacao?.enturmacao_horarios || [];
    };

    const hasAnyScheduleInDB = (turmaId: number, disciplinaId: number) => {
        return getDBAssignedSchedules(turmaId, disciplinaId).length > 0;
    };

    const getOtherAssignedProfessors = (turmaId: number, disciplinaId: number) => {
        return todasEnturmacoes
            .filter(e => e.turma_id === turmaId && e.disciplina_id === disciplinaId && e.usuario_id !== selectedProfessorId)
            .map(e => e.usuarios?.nome || "Outro");
    };

    const isAssignedLocally = (turmaId: number, disciplinaId: number) => {
        const key = `${turmaId}_${disciplinaId}`;
        if (localAssignments[key] !== undefined) {
            return localAssignments[key].length > 0;
        }
        return hasAnyScheduleInDB(turmaId, disciplinaId);
    };

    const handleSaveAll = async () => {
        if (!selectedProfessorId) return;

        const changes = Object.entries(localAssignments);
        if (changes.length === 0) {
            setIsEditMode(false);
            return;
        }

        setLoadingData(true);
        setError("");

        let hasError = false;
        for (const [key, selectedHorarios] of changes) {
            const [turmaIdStr, disciplinaIdStr] = key.split('_');
            const turmaId = parseInt(turmaIdStr);
            const disciplinaId = parseInt(disciplinaIdStr);

            const isCurrentlyAssigned = hasAnyScheduleInDB(turmaId, disciplinaId);
            const willBeAssigned = selectedHorarios.length > 0;

            if (willBeAssigned) {
                // Upsert enturmacao and schedules
                const res = await saveEnturmacaoSchedules(turmaId, disciplinaId, selectedProfessorId, selectedHorarios);
                if (res.error) { setError(res.error); hasError = true; }
            } else if (!willBeAssigned && isCurrentlyAssigned) {
                // Completely remove the enturmacao if all schedules are unchecked
                const res = await deleteEnturmacao(turmaId, disciplinaId, selectedProfessorId);
                if (res.error) { setError(res.error); hasError = true; }
            }
        }

        await fetchEnturmacoes();
        if (!hasError) {
            setIsEditMode(false);
        }
    };

    // Modal Actions
    const openScheduleModal = (turmaId: number, disciplinaId: number, turmaNome: string, disciplinaNome: string) => {
        if (!isEditMode) return;
        setScheduleContext({ turmaId, disciplinaId, turmaNome, disciplinaNome });
    };

    const closeModal = () => {
        setScheduleContext(null);
    };

    // Component for the dynamic modal grid
    const ScheduleGrid = () => {
        if (!scheduleContext) return null;

        const key = `${scheduleContext.turmaId}_${scheduleContext.disciplinaId}`;

        // Get current selected state from local, or default from DB
        const currentSelection = localAssignments[key] !== undefined
            ? localAssignments[key]
            : getDBAssignedSchedules(scheduleContext.turmaId, scheduleContext.disciplinaId);

        const isChecked = (dia: string, hId: number) => {
            return currentSelection.some(s => s.dia_semana === dia && s.horario_id === hId);
        };

        const toggleSlot = (dia: string, hId: number) => {
            const exists = isChecked(dia, hId);
            let nextSelection = [...currentSelection];
            if (exists) {
                nextSelection = nextSelection.filter(s => !(s.dia_semana === dia && s.horario_id === hId));
            } else {
                nextSelection.push({ dia_semana: dia, horario_id: hId });
            }

            setLocalAssignments(prev => ({
                ...prev,
                [key]: nextSelection
            }));
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Grade de Horários</h2>
                            <p className="text-sm text-slate-500">
                                {scheduleContext.disciplinaNome} - {scheduleContext.turmaNome}
                            </p>
                        </div>
                        <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                    <tr>
                                        <th className="px-4 py-3 border-r dark:border-zinc-800 w-32">Horário</th>
                                        {DIAS_SEMANA.map(dia => (
                                            <th key={dia} className="px-4 py-3 text-center border-r dark:border-zinc-800 last:border-0">{dia}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {horarios.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center p-4 text-slate-500">
                                                Nenhum horário de aula cadastrado no sistema.
                                            </td>
                                        </tr>
                                    ) : (
                                        horarios.map((h, i) => (
                                            <tr key={h.id} className="border-t dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                                                <td className="px-4 py-3 border-r dark:border-zinc-800 font-medium text-xs text-slate-500">
                                                    <div>Aula {i + 1}</div>
                                                    <div className="text-slate-400">{h.inicio.slice(0, 5)} - {h.fim.slice(0, 5)}</div>
                                                </td>
                                                {DIAS_SEMANA.map(dia => {
                                                    const checked = isChecked(dia, h.id);
                                                    return (
                                                        <td key={dia} className="p-0 border-r dark:border-zinc-800 last:border-0 h-full cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                                            onClick={() => toggleSlot(dia, h.id)}>
                                                            <div className="w-full h-full min-h-[60px] flex items-center justify-center p-2">
                                                                <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600 text-transparent'}`}>
                                                                    <Check className="w-4 h-4" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                            Selecionados: {currentSelection.length} aulas
                        </span>
                        <Button onClick={closeModal} className="bg-indigo-600 hover:bg-indigo-700">
                            Confirmar Grade
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">


            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/20 flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
                <div className="w-full max-w-md">
                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                        Selecione o Professor
                    </label>
                    <select
                        value={selectedProfessorId}
                        onChange={(e) => setSelectedProfessorId(e.target.value)}
                        disabled={isEditMode}
                        className="w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50"
                    >
                        <option value="">-- Selecione o professor --</option>
                        {professores.map(prof => (
                            <option key={prof.id} value={prof.id}>{prof.nome}</option>
                        ))}
                    </select>
                </div>
                {selectedProfessorId && (
                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        {!isEditMode ? (
                            <Button
                                onClick={() => setIsEditMode(true)}
                                variant="outline"
                                className="w-full md:w-auto"
                            >
                                Modo Edição
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={() => { setIsEditMode(false); setLocalAssignments({}); }}
                                    variant="outline"
                                    className="flex-1 md:flex-none"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSaveAll}
                                    className="bg-indigo-600 hover:bg-indigo-700 flex-1 md:flex-none"
                                    disabled={loadingData}
                                >
                                    {loadingData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Salvar Alterações
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 md:p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {selectedProfessorId === "" ? (
                    <div className="text-center py-12 text-slate-500 dark:text-zinc-400">
                        Selecione um professor acima para visualizar e gerenciar suas turmas e horários.
                    </div>
                ) : loadingData && todasEnturmacoes.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {turmas.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                Nenhuma turma cadastrada.
                            </div>
                        )}
                        {!isEditMode && turmas.length > 0 && !turmas.some(turma => areas.some(a => a.disciplinas.some(d => isAssignedLocally(turma.id, d.id)))) && (
                            <div className="text-center py-8 text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/30 rounded-lg border border-slate-100 dark:border-zinc-800">
                                Nenhuma enturmação vinculada a este professor. Clique em "Modo Edição" para atribuir disciplinas.
                            </div>
                        )}
                        {turmas.map(turma => {
                            const hasAssignments = areas.some(a => a.disciplinas.some(d => isAssignedLocally(turma.id, d.id)));

                            if (!isEditMode && !hasAssignments) {
                                return null;
                            }

                            return (
                                <div key={turma.id} className="border border-slate-200 dark:border-zinc-800 shadow-sm rounded-lg overflow-hidden">
                                    <div className="bg-slate-100 dark:bg-zinc-800 px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                                        <span>{turma.serie} - {turma.nome}</span>
                                    </div>

                                    <table className="w-full text-left text-sm text-slate-600 dark:text-zinc-400">
                                        <thead className="text-xs uppercase bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                                            <tr>
                                                <th className="px-4 py-3 font-medium w-1/4">Área</th>
                                                <th className="px-4 py-3 font-medium w-1/4">Disciplina</th>
                                                <th className="px-4 py-3 font-medium text-center">Horários</th>
                                                <th className="px-4 py-3 font-medium text-right w-1/4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                                            {areas.flatMap(area =>
                                                area.disciplinas.map(discip => {
                                                    const key = `${turma.id}_${discip.id}`;

                                                    const otherProfessors = getOtherAssignedProfessors(turma.id, discip.id);
                                                    const hasOtherProfessors = otherProfessors.length > 0;

                                                    // Determine UI state
                                                    const isAssigned = isAssignedLocally(turma.id, discip.id);

                                                    if (!isEditMode && !isAssigned) {
                                                        return null;
                                                    }

                                                    const localState = localAssignments[key];
                                                    const dbSchedulesStr = JSON.stringify(getDBAssignedSchedules(turma.id, discip.id).map(s => ({ dia_semana: s.dia_semana, horario_id: s.horario_id })).sort((a, b) => a.horario_id - b.horario_id));
                                                    const localSchedulesStr = localState !== undefined ? JSON.stringify([...localState].sort((a, b) => a.horario_id - b.horario_id)) : undefined;

                                                    const hasChanged = localSchedulesStr !== undefined && localSchedulesStr !== dbSchedulesStr;

                                                    // Calculate summary of days
                                                    let schedToSummarize = localState !== undefined ? localState : getDBAssignedSchedules(turma.id, discip.id);
                                                    const daysSet = new Set(schedToSummarize.map(s => s.dia_semana.substring(0, 3)));
                                                    const daysSummary = Array.from(daysSet).join(', ');

                                                    return (
                                                        <tr key={discip.id} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors ${isAssigned ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                                            <td className="px-4 py-3 text-slate-500 text-xs">
                                                                {area.nome}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                                                                {discip.nome}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {isEditMode ? (
                                                                    <Button
                                                                        variant={isAssigned ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => openScheduleModal(turma.id, discip.id, turma.nome, discip.nome)}
                                                                        className={isAssigned ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                                                                    >
                                                                        <Calendar className="w-4 h-4 mr-2" />
                                                                        {isAssigned ? `${schedToSummarize.length} Aulas` : "Configurar"}
                                                                    </Button>
                                                                ) : (
                                                                    isAssigned ? (
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                                                                            <span className="font-medium text-slate-700 dark:text-zinc-300">
                                                                                {schedToSummarize.length} Aula(s)
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-400 dark:text-zinc-600">-</span>
                                                                    )
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="text-xs flex flex-col items-end gap-1">
                                                                    {hasChanged && (
                                                                        <span className="text-indigo-600 font-medium text-xs break-keep">
                                                                            (Modificado)
                                                                        </span>
                                                                    )}
                                                                    {isAssigned && (
                                                                        <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[10px] uppercase tracking-wider">
                                                                            {daysSummary}
                                                                        </span>
                                                                    )}
                                                                    {hasOtherProfessors && (
                                                                        <span className="text-amber-600 mt-1" title={`Também lecionado por: ${otherProfessors.join(', ')}`}>
                                                                            Colega(s): {otherProfessors.join(', ')}
                                                                        </span>
                                                                    )}
                                                                    {!isAssigned && !hasOtherProfessors && (
                                                                        <span className="text-slate-400">
                                                                            Sem professor
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}

                                            {areas.every(a => a.disciplinas.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                                                        Nenhuma disciplina cadastrada.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ScheduleGrid />
        </div>
    );
}
