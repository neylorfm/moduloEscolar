"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Check, XCircle, School, User as UserIcon, Info } from "lucide-react";
import { toast } from "react-toastify";
import { criarAgendamento, cancelarAgendamento, getScoreUsuario } from "@/app/actions/agendamentos";
import { getProfessores } from "@/app/actions/users";
import { getEnturmacoesPorUsuario } from "@/app/actions/enturmacoes";
import { AgendamentoComDetalhes, AgendamentoStatus } from "@/types/agendamento";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    recursoId: number;
    horarioId: number;
    data: string; // ISO yyyy-MM-dd
    horarioTexto: string;
    slotsExistentes: AgendamentoComDetalhes[];
    usuarioAtual: { id: string, tipo: string };
}

export default function BookingModal({
    isOpen, onClose, onSuccess, recursoId, horarioId, data, horarioTexto, slotsExistentes, usuarioAtual
}: BookingModalProps) {
    const [loading, setLoading] = useState(false);
    const [scoreData, setScoreData] = useState<{ score: number, a: number, c: number } | null>(null);

    const [queueScores, setQueueScores] = useState<Record<string, { score: number, a: number, c: number }>>({});

    const isAdminOrCoord = usuarioAtual.tipo === 'administrador' || usuarioAtual.tipo === 'coordenador';

    const [professores, setProfessores] = useState<{ id: string, nome: string, alias: string }[]>([]);
    const [enturmacoes, setEnturmacoes] = useState<any[]>([]);

    const [bookingType, setBookingType] = useState<'escola' | 'professor' | null>(isAdminOrCoord ? 'escola' : 'professor');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(isAdminOrCoord ? "" : usuarioAtual.id);

    // Novas seleções separadas em vez de enturmacao unica
    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<number | "">("");
    const [selectedSerie, setSelectedSerie] = useState<string>("");
    const [selectedTurmaId, setSelectedTurmaId] = useState<number | "">("");

    // Filtros de slots e Queue
    const hasFixo = slotsExistentes.some(s => s.status === 'FIXO');
    const hasConfirmado = slotsExistentes.some(s => s.status === 'CONFIRMADO');
    const myPreReserva = slotsExistentes.find(s => s.usuario_id === usuarioAtual.id && s.status === 'PRE_RESERVA');

    // Sort Queue by Score for Display
    const preReservasQueue = slotsExistentes
        .filter(s => s.status === 'PRE_RESERVA')
        .sort((a, b) => {
            if (a.is_escola && !b.is_escola) return -1;
            if (!a.is_escola && b.is_escola) return 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

    useEffect(() => {
        if (!isOpen) return;

        const fetchQueueScores = async () => {
            const newScores: Record<string, { score: number, a: number, c: number }> = {};
            for (const slot of preReservasQueue) {
                if (!slot.is_escola && slot.usuario_id && !queueScores[slot.usuario_id]) {
                    const res = await getScoreUsuario(slot.usuario_id as string, recursoId, data);
                    newScores[slot.usuario_id] = res;
                }
            }
            if (Object.keys(newScores).length > 0) {
                setQueueScores(prev => ({ ...prev, ...newScores }));
            }
        };
        fetchQueueScores();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, slotsExistentes, recursoId, data]);

    useEffect(() => {
        if (isOpen && isAdminOrCoord) {
            getProfessores().then(res => {
                if (res.data) setProfessores(res.data);
            });
        }
    }, [isOpen, isAdminOrCoord]);

    useEffect(() => {
        if (isOpen && selectedTeacherId && bookingType === 'professor') {
            getEnturmacoesPorUsuario(selectedTeacherId).then(res => {
                if (res.data) setEnturmacoes(res.data);
                setSelectedDisciplinaId("");
                setSelectedSerie("");
                setSelectedTurmaId("");
            });
        } else {
            setEnturmacoes([]);
            setSelectedDisciplinaId("");
            setSelectedSerie("");
            setSelectedTurmaId("");
        }
    }, [isOpen, selectedTeacherId, bookingType]);

    useEffect(() => {
        if (isOpen) {
            if (bookingType === 'escola') {
                setScoreData({ score: 0, a: 0, c: 0 });
            } else if (bookingType === 'professor' && selectedTeacherId) {
                getScoreUsuario(selectedTeacherId, recursoId, data).then(res => setScoreData(res));
            } else {
                setScoreData(null);
            }
        }
    }, [isOpen, bookingType, selectedTeacherId, recursoId, data]);

    if (!isOpen) return null;

    const dtFormatada = format(new Date(data + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR });

    const dataAgendamentoDate = new Date(data + "T12:00:00");
    const dataAtual = new Date();
    const dAtual = dataAtual.getDay(); // 0=Dom, 1=Seg, ..., 5=Sex, 6=Sáb

    const inicioSemanaAtual = startOfWeek(dataAtual, { weekStartsOn: 1 });
    const inicioSemanaAgendamento = startOfWeek(dataAgendamentoDate, { weekStartsOn: 1 });

    // Diferença de semanas entre o agendamento e hoje
    const weekDiff = Math.round((inicioSemanaAgendamento.getTime() - inicioSemanaAtual.getTime()) / (7 * 24 * 60 * 60 * 1000));

    let isPreReserva = false;
    // Se hoje for Seg(1), Ter(2), Qua(3), Qui(4)
    if (dAtual >= 1 && dAtual <= 4) {
        // Para a próxima semana em diante (weekDiff >= 1), é pré-reserva
        isPreReserva = weekDiff >= 1;
    } else {
        // Se hoje for Sex(5), Sab(6), Dom(0)
        // 2 semanas ou mais pra frente, é pré-reserva. (0 e 1 são diretos)
        isPreReserva = weekDiff >= 2;
    }

    // Verifica se a data e horário do agendamento já passou
    // Assume que horarioTexto está no formato "HH:mm"
    const isPassado = new Date(`${data}T${horarioTexto}:00`) < dataAtual;

    // Filtros adicionais para os selects derivados exclusivamente das enturmações selecionadas
    const disciplinasUnicas = Array.from(new Map(enturmacoes.map(e => [e.disciplinas.id, e.disciplinas])).values());

    const enturmacoesDisciplina = enturmacoes.filter(e => selectedDisciplinaId ? e.disciplina_id === selectedDisciplinaId : true);
    const seriesUnicas = Array.from(new Set(enturmacoesDisciplina.map(e => e.turmas.serie))).sort();

    const turmasFiltradas = Array.from(new Map(
        enturmacoesDisciplina
            .filter(e => e.turmas.serie === selectedSerie)
            .map(e => [e.turmas.id, e.turmas])
    ).values()).sort((a, b: any) => a.nome.localeCompare(b.nome));

    async function handleReservar() {
        if (bookingType === 'professor') {
            if (!selectedTeacherId) {
                toast.error("Selecione um professor.");
                return;
            }
            if (!selectedDisciplinaId || !selectedTurmaId) {
                toast.error("Selecione uma disciplina e uma turma.");
                return;
            }
        }

        setLoading(true);
        try {
            if (hasFixo || hasConfirmado) {
                toast.error("Horário indisponível.");
                return;
            }

            const status: AgendamentoStatus = isPreReserva ? 'PRE_RESERVA' : 'CONFIRMADO';

            const res = await criarAgendamento({
                recurso_id: recursoId,
                horario_id: horarioId,
                data_agendamento: data,
                status: status,
                criado_por: usuarioAtual.id,
                conta_score: bookingType === 'professor',
                projeto: null,
                disponivel_ate: null,
                is_escola: bookingType === 'escola',
                usuario_id: bookingType === 'professor' ? selectedTeacherId : null,
                turma_id: bookingType === 'professor' ? Number(selectedTurmaId) : null,
                disciplina_id: bookingType === 'professor' ? Number(selectedDisciplinaId) : null
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(isPreReserva ? "Pré-reserva efetuada na Fila!" : "Reserva confirmada!");
                onSuccess();
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleCancelar(id: string, isPreReservaSlot: boolean = false) {
        const mensagem = isPreReservaSlot
            ? "Deseja sair da fila de pré-reserva?"
            : "Confirmar cancelamento? Isso será registrado no seu score.";

        if (!confirm(mensagem)) return;

        setLoading(true);
        try {
            const res = await cancelarAgendamento(id);
            if (res.error) toast.error(res.error);
            else {
                toast.success(isPreReservaSlot ? "Removido da fila com sucesso!" : "Cancelado com sucesso!");
                onSuccess();
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col md:max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Agendar Recurso</h2>
                        <p className="text-sm text-slate-500 mt-1">{dtFormatada} às {horarioTexto}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Lista de Reservas Atuais */}
                    {slotsExistentes.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Situação Atual</h3>
                            <div className="space-y-2">
                                {hasConfirmado && slotsExistentes.filter(s => s.status === 'CONFIRMADO').map(slot => (
                                    <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg border border-indigo-200 bg-indigo-50">
                                        <div>
                                            <div className="font-medium text-indigo-900">{slot.is_escola ? 'Escola' : (slot.usuario?.alias || slot.usuario?.nome)}</div>
                                            <div className="text-xs text-indigo-700 flex items-center gap-1">
                                                <Check size={12} /> Confirmado
                                                {slot.disciplina && ` • ${slot.disciplina.nome} (${slot.turma?.serie} ${slot.turma?.nome})`}
                                            </div>
                                        </div>
                                        {(isAdminOrCoord || slot.usuario_id === usuarioAtual.id) && !isPassado && (
                                            <button onClick={() => handleCancelar(slot.id, false)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Cancelar Agendamento">
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {preReservasQueue.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-xs font-semibold text-slate-500 mb-2">Fila de Pré-Reserva (Próximas Semanas)</h4>
                                        <div className="space-y-2">
                                            {preReservasQueue.map((slot, idx) => {
                                                const qScore = slot.usuario_id ? queueScores[slot.usuario_id] : null;
                                                const finalScore = qScore ? qScore.score + (idx + 1) : null;

                                                return (
                                                    <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
                                                        <div>
                                                            <div className="font-medium text-amber-900 flex items-center">
                                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold mr-2">{idx + 1}</span>
                                                                {slot.is_escola ? 'Escola' : (slot.usuario?.alias || slot.usuario?.nome)}
                                                                <span className="ml-3 text-[10px] bg-amber-200/50 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                                                                    {slot.is_escola ? 'S:0  A:0  C:0  O:0' :
                                                                        qScore ? `S:${finalScore}  A:${qScore.a}  C:${qScore.c}  O:${idx + 1}` :
                                                                            `S:...  A:...  C:...  O:${idx + 1}`}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-amber-700 mt-1 ml-7">
                                                                {slot.disciplina && `${slot.disciplina.nome} (${slot.turma?.serie} ${slot.turma?.nome})`}
                                                            </div>
                                                        </div>
                                                        {(isAdminOrCoord || slot.usuario_id === usuarioAtual.id) && !isPassado && (
                                                            <button onClick={() => handleCancelar(slot.id, true)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Sair da Fila">
                                                                <XCircle size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(!hasFixo && !hasConfirmado && !myPreReserva) && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-700">Detalhes do Agendamento</h3>

                            {isAdminOrCoord && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        onClick={() => setBookingType('escola')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${bookingType === 'escola' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <School size={24} className="mb-1" />
                                        <span className="text-sm font-medium">Escola</span>
                                    </button>
                                    <button
                                        onClick={() => setBookingType('professor')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${bookingType === 'professor' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <UserIcon size={24} className="mb-1" />
                                        <span className="text-sm font-medium">Professor</span>
                                    </button>
                                </div>
                            )}

                            {bookingType === 'professor' && (
                                <div className="space-y-3">
                                    {isAdminOrCoord && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Selecione o Professor</label>
                                            <select
                                                value={selectedTeacherId}
                                                onChange={e => setSelectedTeacherId(e.target.value)}
                                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                                            >
                                                <option value="" disabled>-- Selecione --</option>
                                                {professores.map(p => <option key={p.id} value={p.id}>{p.nome} {p.alias ? `(${p.alias})` : ''}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {selectedTeacherId && (
                                        <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Disciplina</label>
                                                {disciplinasUnicas.length === 0 ? (
                                                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                                        Nenhuma disciplina atribuída a este professor.
                                                    </p>
                                                ) : (
                                                    <select
                                                        value={selectedDisciplinaId}
                                                        onChange={e => {
                                                            setSelectedDisciplinaId(Number(e.target.value));
                                                            setSelectedSerie("");
                                                            setSelectedTurmaId("");
                                                        }}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                                                    >
                                                        <option value="" disabled>-- Selecione a Disciplina --</option>
                                                        {disciplinasUnicas.map((d: any) => (
                                                            <option key={d.id} value={d.id}>
                                                                {d.nome}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Série</label>
                                                    <select
                                                        value={selectedSerie}
                                                        onChange={e => {
                                                            setSelectedSerie(e.target.value);
                                                            setSelectedTurmaId(""); // reset turma when serie changes
                                                        }}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                                                    >
                                                        <option value="" disabled>-- Série --</option>
                                                        {seriesUnicas.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Turma</label>
                                                    <select
                                                        value={selectedTurmaId}
                                                        onChange={e => setSelectedTurmaId(Number(e.target.value))}
                                                        disabled={!selectedSerie}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-100 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                                    >
                                                        <option value="" disabled>-- Turma --</option>
                                                        {turmasFiltradas.map(t => (
                                                            <option key={t.id} value={t.id}>{t.nome}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {bookingType === 'escola' && (
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <p className="text-sm text-indigo-800">
                                        Agendamento institucional. Tem prioridade na fila e não consome Score.
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Modalidade</p>
                                    <p className={`text-sm font-bold flex items-center gap-1.5 ${isPreReserva ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {isPreReserva ? 'Fila de Pré-Reserva' : 'Agendamento Direto'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">
                                        {isPreReserva ? 'Na próxima semana. Aguarde a sexta-feira para confirmar.' : 'Nesta semana. Uso liberado e garantido.'}
                                    </p>
                                </div>
                                <div className="text-left md:text-right bg-white p-2 rounded border border-slate-200 w-full md:w-auto">
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Projeção da Fila</p>
                                    <div className="flex gap-3 text-sm font-mono text-slate-700">
                                        <span title="Score Final">S:{scoreData ? (scoreData.score + preReservasQueue.length + 1) : 0}</span>
                                        <span title="Agendamentos Recentes" className="text-slate-400">A:{scoreData ? scoreData.a : 0}</span>
                                        <span title="Cancelamentos Recentes" className="text-slate-400">C:{scoreData ? scoreData.c : 0}</span>
                                        <span title="Ordem na Fila" className="text-slate-400">O:{preReservasQueue.length + 1}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleReservar}
                                disabled={loading || (bookingType === 'professor' && (!selectedTeacherId || !selectedDisciplinaId || !selectedTurmaId))}
                                className={`w-full py-3 text-white rounded-lg font-medium active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-sm hover:shadow-md
                                    ${isPreReserva ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                {loading ? "Processando..." : (isPreReserva ? "Registrar a Pré-Reserva" : "Confirmar Reserva")}
                            </button>
                        </div>
                    )}
                </div>

                {/* Legenda Explicativa */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto">
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                        <Info size={14} className="mt-0.5 shrink-0" />
                        <p>
                            <strong>Cálculo do Score (S):</strong> Soma dos Agendamentos(A) e Cancelamentos(C) dos últimos 21 dias + Ordem(O) de Solicitação.
                            <span className="block mt-1 text-slate-600">Quanto <span className="font-bold underline">menor</span> a pontuação, <span className="font-bold text-emerald-600">maior</span> a prioridade.</span>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
