"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { Agendamento, AgendamentoComDetalhes, AgendamentoSemanaConfig } from "@/types/agendamento";
import { startOfWeek, addWeeks, format, parseISO, isFriday, getHours, getMinutes } from "date-fns";

export async function getConfiguracaoSemanas(dataSegunda: string): Promise<AgendamentoSemanaConfig | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from("agendamento_semanas_config")
            .select("*")
            .eq("data_segunda", dataSegunda)
            .single();

        if (error && error.code !== "PGRST116") throw error; // PGRST116 is not found
        return data || null;
    } catch (err: any) {
        console.error("Erro ao buscar configuração da semana:", err);
        return null;
    }
}

export async function setConfiguracaoSemana(dataSegunda: string, sabadoAtivo: boolean) {
    try {
        const { error } = await supabaseAdmin
            .from("agendamento_semanas_config")
            .upsert({ data_segunda: dataSegunda, sabado_ativo: sabadoAtivo });

        if (error) throw error;
        revalidatePath("/agendamentos");
        return { success: true };
    } catch (err: any) {
        console.error("Erro ao configurar semana:", err);
        return { error: err.message };
    }
}

export async function getAgendamentosPorSemana(dataInicio: string, dataFim: string, recursoId?: number): Promise<{ data?: AgendamentoComDetalhes[], error?: string }> {
    try {
        let query = supabaseAdmin
            .from("agendamentos")
            .select(`
                *,
                usuario:usuario_id (id, nome, avatar_url, alias),
                criado_por_usuario:criado_por (id, nome),
                horario:horario_id (id, inicio, fim, tipo),
                recurso:recurso_id (id, nome, icone),
                turma:turma_id (id, serie, nome),
                disciplina:disciplina_id (id, nome)
            `)
            .gte("data_agendamento", dataInicio)
            .lte("data_agendamento", dataFim)
            .order("data_agendamento", { ascending: true });

        if (recursoId) {
            query = query.eq("recurso_id", recursoId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data: data as any[] };
    } catch (err: any) {
        console.error("Erro ao buscar agendamentos:", err);
        return { error: err.message };
    }
}

export async function criarAgendamento(agendamento: Omit<Agendamento, 'id' | 'created_at' | 'updated_at' | 'cancelled_at'>) {
    try {
        const { data, error } = await supabaseAdmin
            .from("agendamentos")
            .insert([agendamento])
            .select()
            .single();

        if (error) throw error;
        revalidatePath("/agendamentos");
        return { success: true, data };
    } catch (err: any) {
        console.error("Erro ao criar agendamento:", err);
        return { error: err.message };
    }
}

export async function cancelarAgendamento(id: string) {
    try {
        // Obter dados do agendamento para verificar a data/hora e o status
        const { data: agendamento } = await supabaseAdmin
            .from("agendamentos")
            .select(`
                status,
                data_agendamento,
                horarios(inicio)
            `)
            .eq("id", id)
            .single();

        if (agendamento && agendamento.horarios) {
            const horarioInicio = Array.isArray(agendamento.horarios)
                ? agendamento.horarios[0].inicio
                : (agendamento.horarios as any).inicio;

            const horarioTexto = horarioInicio.slice(0, 5);
            const dataAgendamentoObj = new Date(`${agendamento.data_agendamento}T${horarioTexto}:00`);

            if (dataAgendamentoObj < new Date()) {
                return { error: "Não é permitido cancelar agendamentos cujo horário já passou." };
            }

            // Se for pré-reserva, deletar direto para não contar como cancelamento no score
            if (agendamento.status === 'PRE_RESERVA') {
                const { error: deleteError } = await supabaseAdmin
                    .from("agendamentos")
                    .delete()
                    .eq("id", id);
                if (deleteError) throw deleteError;

                revalidatePath("/agendamentos");
                return { success: true };
            }
        }

        const { error } = await supabaseAdmin
            .from("agendamentos")
            .update({ status: 'CANCELADO', cancelled_at: new Date().toISOString() })
            .eq("id", id);

        if (error) throw error;
        revalidatePath("/agendamentos");
        return { success: true };
    } catch (err: any) {
        console.error("Erro ao cancelar agendamento:", err);
        return { error: err.message };
    }
}

export async function updateInstituicaoSemanas(id: number, semanas: number) {
    try {
        const { error } = await supabaseAdmin
            .from("instituicao")
            .update({ semanas_agendamento: semanas })
            .eq("id", id);

        if (error) throw error;
        revalidatePath("/settings");
        revalidatePath("/agendamentos");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
export async function getScoreUsuario(usuarioId: string, recursoId: number, dataAgendamento: string): Promise<{ score: number, a: number, c: number }> {
    try {
        const dataReferencia = parseISO(dataAgendamento);
        const dataLimiteInicio = addWeeks(dataReferencia, -3).toISOString();

        // Count A: Agendamentos nas últimas 3 semanas para este recurso
        const { count: countA, error: errA } = await supabaseAdmin
            .from("agendamentos")
            .select("*", { count: 'exact', head: true })
            .eq("usuario_id", usuarioId)
            .eq("recurso_id", recursoId)
            .in("status", ["CONFIRMADO", "FIXO"])
            .gte("data_agendamento", dataLimiteInicio)
            .lt("data_agendamento", dataAgendamento)
            .eq("conta_score", true);

        if (errA) throw errA;

        // Count C: Cancelamentos nas últimas 3 semanas para este recurso
        const { count: countC, error: errC } = await supabaseAdmin
            .from("agendamentos")
            .select("*", { count: 'exact', head: true })
            .eq("usuario_id", usuarioId)
            .eq("recurso_id", recursoId)
            .eq("status", "CANCELADO")
            .gte("data_agendamento", dataLimiteInicio)
            .lt("data_agendamento", dataAgendamento)
            .eq("conta_score", true);

        if (errC) throw errC;

        // O = O (Ordem) will be calculated in the UI depending on the current Queue of PRE_RESERVA

        const a = countA || 0;
        const c = countC || 0;
        const scoreBase = a + c;

        return { score: scoreBase, a, c };
    } catch (err: any) {
        console.error("Erro ao calcular score:", err);
        return { score: 0, a: 0, c: 0 }; // default score fallback
    }
}
