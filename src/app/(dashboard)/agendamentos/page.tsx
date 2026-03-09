"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addWeeks, subWeeks, addDays, isFriday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getRecursos } from "@/app/actions/recursos";
import { getHorarios, Horario } from "@/app/actions/horarios";
import { getInstituicao } from "@/app/actions/instituicao";
import { supabase } from "@/lib/supabase-client";
import { ChevronLeft, ChevronRight, Settings2, Plus } from "lucide-react";
import { AgendamentoComDetalhes, AgendamentoSemanaConfig } from "@/types/agendamento";
import { getConfiguracaoSemanas, getAgendamentosPorSemana, setConfiguracaoSemana } from "@/app/actions/agendamentos";
import { toast } from "react-toastify";
import BookingModal from "./BookingModal";

interface Recurso {
    id: number;
    nome: string;
    icone: string;
}

export default function AgendamentosPage() {
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        const d = today.getDay();
        if (d === 0 || d === 6) {
            return addDays(today, d === 0 ? 1 : 2); // Jump to Monday
        }
        return today;
    });
    const [instituicao, setInstituicao] = useState<any>(null);
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [horarios, setHorarios] = useState<Horario[]>([]);
    const [agendamentos, setAgendamentos] = useState<AgendamentoComDetalhes[]>([]);
    const [selectedRecurso, setSelectedRecurso] = useState<number | null>(null);
    const [sabadoAtivo, setSabadoAtivo] = useState(false);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{ recursoId: number, horarioId: number, data: string, horarioTexto: string } | null>(null);
    const [usuarioAtual, setUsuarioAtual] = useState<{ id: string, tipo: string } | null>(null);

    const dataSegunda = startOfWeek(currentDate, { weekStartsOn: 1 });
    const dataSegundaIso = format(dataSegunda, "yyyy-MM-dd");
    const isAdminOrCoord = usuarioAtual?.tipo === 'administrador' || usuarioAtual?.tipo === 'coordenador';

    useEffect(() => {
        carregarDadosBase();
    }, []);

    useEffect(() => {
        carregarAgendamentos();

        // Inscreve no Supabase Realtime para a tabela agendamentos
        const channel = supabase
            .channel('agendamentos-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'agendamentos',
                    filter: selectedRecurso ? `recurso_id=eq.${selectedRecurso}` : undefined
                },
                (payload) => {
                    // console.log('Realtime change received!', payload);
                    carregarAgendamentos();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dataSegundaIso, selectedRecurso]);

    async function carregarDadosBase() {
        const [resRecursos, resHorarios, resInstituicao] = await Promise.all([
            getRecursos(),
            getHorarios(),
            getInstituicao()
        ]);
        if (resRecursos.data) setRecursos(resRecursos.data);
        if (resHorarios.data) setHorarios(resHorarios.data);
        if (resInstituicao.data) setInstituicao(resInstituicao.data);

        if (resRecursos.data && resRecursos.data.length > 0) {
            setSelectedRecurso(resRecursos.data[0].id);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: userProfile } = await supabase.from('usuarios').select('id, tipo').eq('id', session.user.id).single();
            if (userProfile) setUsuarioAtual({ id: userProfile.id, tipo: userProfile.tipo });
        }
    }

    async function carregarAgendamentos() {
        if (!selectedRecurso) return;
        setLoading(true);
        const dataSabado = format(addDays(dataSegunda, 5), "yyyy-MM-dd"); // Seg to Sab -> 5 days

        const [resConfig, resAgendamentos] = await Promise.all([
            getConfiguracaoSemanas(dataSegundaIso),
            getAgendamentosPorSemana(dataSegundaIso, dataSabado, selectedRecurso)
        ]);

        if (resConfig) setSabadoAtivo(resConfig.sabado_ativo);
        else setSabadoAtivo(false);

        if (resAgendamentos.data) setAgendamentos(resAgendamentos.data);
        setLoading(false);
    }

    async function handleToggleSabado() {
        const newValue = !sabadoAtivo;
        setSabadoAtivo(newValue);
        await setConfiguracaoSemana(dataSegundaIso, newValue);
        toast.success("Configuração da semana atualizada.");
    }

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

    const getDiasSemana = () => {
        const dias = [];
        for (let i = 0; i < (sabadoAtivo ? 6 : 5); i++) {
            dias.push(addDays(dataSegunda, i));
        }
        return dias;
    };

    const diasSemana = getDiasSemana();

    const maxWeeks = instituicao?.semanas_agendamento || 4;
    const todayReal = new Date();
    const dReal = todayReal.getDay();
    const baseDate = (dReal === 0 || dReal === 6) ? addDays(todayReal, dReal === 0 ? 1 : 2) : todayReal;
    const baseWeekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDiff = Math.round((currentWeekStart.getTime() - baseWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Agendamentos</h1>
                    <p className="text-sm text-slate-500 mt-1">Gerencie reservas e ocupações dos recursos da escola.</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        className="p-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer shadow-sm"
                        value={selectedRecurso || ""}
                        onChange={(e) => setSelectedRecurso(Number(e.target.value))}
                    >
                        {recursos.map(r => (
                            <option key={r.id} value={r.id}>{r.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-4 border border-slate-100 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={prevWeek} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex flex-col items-center justify-center min-w-[200px]">
                            <div className="font-semibold text-slate-700 text-center">
                                Semana de {format(dataSegunda, "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="text-xs text-slate-500 font-medium tracking-wide">
                                {weekDiff === 0 ? "Semana Atual" : weekDiff > 0 ? `Semana ${weekDiff + 1} de ${maxWeeks}` : "Histórico"}
                            </div>
                        </div>
                        <button
                            onClick={nextWeek}
                            disabled={weekDiff >= maxWeeks - 1}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {isAdminOrCoord && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    checked={sabadoAtivo}
                                    onChange={handleToggleSabado}
                                />
                                Incluir Sábado nesta semana
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden relative">
                    <div className="overflow-x-auto max-h-[65vh]">
                        <table className="w-full text-sm text-left relative">
                            <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-center w-24 sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0]">Horário</th>
                                    {diasSemana.map((dia, i) => (
                                        <th key={i} className="px-4 py-3 text-center min-w-[150px] bg-slate-50">
                                            <div className="text-indigo-600 font-bold">{format(dia, "EEEE", { locale: ptBR })}</div>
                                            <div className="font-normal text-slate-500">{format(dia, "dd/MM")}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {horarios.map((horario) => (
                                    <tr key={horario.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 text-center border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                                            <div className="font-medium text-slate-700">{horario.inicio.slice(0, 5)}</div>
                                            <div className="text-xs text-slate-400">{horario.fim.slice(0, 5)}</div>
                                            <span className="text-[10px] inline-flex mt-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                                {horario.tipo}
                                            </span>
                                        </td>
                                        {diasSemana.map((dia, i) => {
                                            const diaIso = format(dia, "yyyy-MM-dd");
                                            const isPast = dia < new Date(new Date().setHours(0, 0, 0, 0));
                                            const slots = agendamentos.filter(a => a.horario_id === horario.id && a.data_agendamento === diaIso && a.status !== "CANCELADO");

                                            // TODO: RENDER SLOTS Component
                                            return (
                                                <td key={i} className={`px-2 py-2 border-r border-slate-100 last:border-r-0 relative group h-24 ${isPast ? 'bg-slate-50/50' : ''}`}>
                                                    <div className="w-full h-full flex flex-col gap-1">
                                                        {slots.length > 0 ? (
                                                            slots.map(s => (
                                                                <div
                                                                    key={s.id}
                                                                    onClick={() => {
                                                                        if (selectedRecurso) {
                                                                            setModalData({ recursoId: selectedRecurso, horarioId: horario.id, data: diaIso, horarioTexto: horario.inicio.slice(0, 5) });
                                                                            setModalOpen(true);
                                                                        }
                                                                    }}
                                                                    className={`text-xs p-1.5 rounded-md text-slate-700 border shadow-sm truncate cursor-pointer transition-colors ${s.status === 'PRE_RESERVA' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : s.status === 'FIXO' ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'}`}
                                                                >
                                                                    <span className="font-semibold block truncate">{s.usuario?.alias || s.usuario?.nome}</span>
                                                                    <span className="text-[10px] opacity-75">{s.status === 'PRE_RESERVA' ? 'Pré-reserva' : s.status === 'FIXO' ? 'Fixo' : 'Confirmado'}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            !isPast && <button
                                                                onClick={() => {
                                                                    if (selectedRecurso) {
                                                                        setModalData({ recursoId: selectedRecurso, horarioId: horario.id, data: diaIso, horarioTexto: horario.inicio.slice(0, 5) });
                                                                        setModalOpen(true);
                                                                    }
                                                                }}
                                                                className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/20 transition-all flex items-center justify-center font-medium bg-slate-50/30 opacity-60 hover:opacity-100"
                                                            >
                                                                <div className="flex items-center gap-1.5"><Plus size={14} /> Agendar</div>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modalOpen && modalData && usuarioAtual && (
                <BookingModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => {
                        setModalOpen(false);
                        carregarAgendamentos();
                    }}
                    recursoId={modalData.recursoId}
                    horarioId={modalData.horarioId}
                    data={modalData.data}
                    horarioTexto={modalData.horarioTexto}
                    usuarioAtual={usuarioAtual}
                    slotsExistentes={agendamentos.filter(a => a.horario_id === modalData.horarioId && a.data_agendamento === modalData.data && a.status !== "CANCELADO")}
                />
            )}
        </div>
    );
}
