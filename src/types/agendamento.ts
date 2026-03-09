export type AgendamentoStatus = 'PRE_RESERVA' | 'CONFIRMADO' | 'FIXO' | 'CANCELADO';

export interface Agendamento {
    id: string;
    recurso_id: number;
    usuario_id: string;
    criado_por: string | null;
    data_agendamento: string; // ISO Date string
    horario_id: number;
    status: AgendamentoStatus;
    projeto: string | null;
    disponivel_ate: string | null;
    conta_score: boolean;
    created_at: string;
    updated_at: string;
    cancelled_at: string | null;
    is_escola: boolean;
    turma_id: number | null;
    disciplina_id: number | null;
}

export interface AgendamentoComDetalhes extends Agendamento {
    usuario?: { id: string; nome: string; avatar_url: string | null; alias: string | null };
    criado_por_usuario?: { id: string; nome: string };
    horario?: { id: number; inicio: string; fim: string; tipo: string };
    recurso?: { id: number; nome: string; icone: string };
    turma?: { id: number; serie: string; nome: string };
    disciplina?: { id: number; nome: string };
}

export interface AgendamentoSemanaConfig {
    data_segunda: string; // ISO Date string
    sabado_ativo: boolean;
}
