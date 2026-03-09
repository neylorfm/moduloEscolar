"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type EnturmacaoHorario = {
    id: number;
    enturmacao_id: number;
    dia_semana: string;
    horario_id: number;
    horarios?: {
        inicio: string;
        fim: string;
    };
};

export type Enturmacao = {
    id: number;
    turma_id: number;
    disciplina_id: number;
    usuario_id: string;
    usuarios?: {
        nome: string;
    };
    enturmacao_horarios?: EnturmacaoHorario[];
};

export async function getEnturmacoesPorTurma(turmaId: number): Promise<{ data?: Enturmacao[], error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from("enturmacoes")
            .select(`
                id,
                turma_id,
                disciplina_id,
                usuario_id,
                usuarios (
                    nome
                ),
                enturmacao_horarios (
                    id,
                    enturmacao_id,
                    dia_semana,
                    horario_id,
                    horarios!inner(inicio, fim)
                )
            `)
            .eq("turma_id", turmaId);

        if (error) throw error;

        const formattedData = data?.map(d => ({
            ...d,
            usuarios: Array.isArray(d.usuarios) ? d.usuarios[0] : d.usuarios,
            enturmacao_horarios: d.enturmacao_horarios?.map((eh: any) => ({
                ...eh,
                horarios: Array.isArray(eh.horarios) ? eh.horarios[0] : eh.horarios
            }))
        }));

        return { data: formattedData as Enturmacao[] };
    } catch (err: any) {
        console.error("Error fetching enturmacoes:", err.message);
        return { error: err.message };
    }
}

export async function getEnturmacoesPorUsuario(usuarioId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from("enturmacoes")
            .select(`
                id,
                turma_id,
                disciplina_id,
                turmas (id, serie, nome),
                disciplinas (id, nome),
                enturmacao_horarios!inner(id)
            `)
            .eq("usuario_id", usuarioId);

        if (error) throw error;

        const formattedData = data?.map(d => ({
            ...d,
            turmas: Array.isArray(d.turmas) ? d.turmas[0] : d.turmas,
            disciplinas: Array.isArray(d.disciplinas) ? d.disciplinas[0] : d.disciplinas,
        }));

        return { data: formattedData as any[] };
    } catch (err: any) {
        console.error("Error fetching enturmacoes por usuario:", err.message);
        return { error: err.message };
    }
}

export async function getAllEnturmacoes(): Promise<{ data?: Enturmacao[], error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from("enturmacoes")
            .select(`
                id,
                turma_id,
                disciplina_id,
                usuario_id,
                usuarios (
                    nome
                ),
                enturmacao_horarios (
                    id,
                    enturmacao_id,
                    dia_semana,
                    horario_id,
                    horarios!inner(inicio, fim)
                )
            `);

        if (error) throw error;

        // Ensure returning types match the expected structure
        const formattedData = data?.map(d => ({
            ...d,
            usuarios: Array.isArray(d.usuarios) ? d.usuarios[0] : d.usuarios,
            enturmacao_horarios: d.enturmacao_horarios?.map((eh: any) => ({
                ...eh,
                horarios: Array.isArray(eh.horarios) ? eh.horarios[0] : eh.horarios
            }))
        }));

        return { data: formattedData as Enturmacao[] };
    } catch (err: any) {
        console.error("Error fetching all enturmacoes:", err.message);
        return { error: err.message };
    }
}

// Instead of simple upsert, now we manage schedules
export async function saveEnturmacaoSchedules(
    turmaId: number,
    disciplinaId: number,
    usuarioId: string,
    horarios: { dia_semana: string, horario_id: number }[]
) {
    try {
        // 1. Ensure enturmacao exists or create it
        const { data: eData, error: upsertError } = await supabaseAdmin
            .from("enturmacoes")
            .upsert(
                { turma_id: turmaId, disciplina_id: disciplinaId, usuario_id: usuarioId },
                { onConflict: 'turma_id, disciplina_id, usuario_id' }
            )
            .select("id")
            .single();

        if (upsertError) throw upsertError;

        const enturmacaoId = eData.id;

        // 2. Delete existing schedules for this enturmacao
        const { error: deleteError } = await supabaseAdmin
            .from("enturmacao_horarios")
            .delete()
            .eq("enturmacao_id", enturmacaoId);

        if (deleteError) throw deleteError;

        // 3. Insert new schedules if any
        if (horarios && horarios.length > 0) {
            const horariosToInsert = horarios.map(h => ({
                enturmacao_id: enturmacaoId,
                dia_semana: h.dia_semana,
                horario_id: h.horario_id
            }));

            const { error: insertError } = await supabaseAdmin
                .from("enturmacao_horarios")
                .insert(horariosToInsert);

            if (insertError) throw insertError;
        }

        revalidatePath("/settings");
        revalidatePath("/settings/enturmacao");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function deleteEnturmacao(turmaId: number, disciplinaId: number, usuarioId: string) {
    try {
        const { error } = await supabaseAdmin
            .from("enturmacoes")
            .delete()
            .match({ turma_id: turmaId, disciplina_id: disciplinaId, usuario_id: usuarioId });

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/enturmacao");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export type CSVEnturmacaoRow = {
    turma_serie: string;
    turma_nome: string;
    disciplina: string;
    email_professor: string;
    dia_semana: string;
    aula: string;
};

export async function importEnturmacoesCSV(rows: CSVEnturmacaoRow[]) {
    try {
        // 1. Fetch all necessary data for reconciliation
        const [
            { data: turmas },
            { data: disciplinas },
            { data: usuarios },
            { data: horarios }
        ] = await Promise.all([
            supabaseAdmin.from("turmas").select("id, serie, nome"),
            supabaseAdmin.from("disciplinas").select("id, nome"),
            supabaseAdmin.from("usuarios").select("id, email"),
            supabaseAdmin.from("horarios").select("id, inicio, tipo").eq("tipo", "Aula").order("inicio", { ascending: true })
        ]);

        if (!turmas || !disciplinas || !usuarios || !horarios) {
            return { error: "Erro ao buscar dados de referência no banco." };
        }

        const validImports: {
            turmaId: number;
            disciplinaId: number;
            usuarioId: string;
            dia_semana: string;
            horario_id: number;
        }[] = [];

        const errors: string[] = [];

        // 2. Process rows and reconcile string -> IDs
        rows.forEach((row, index) => {
            const rowNumber = index + 2; // +1 for 0-index, +1 for header

            // Match Turma
            const turmaMatch = turmas.find(t =>
                t.serie.toLowerCase() === row.turma_serie.trim().toLowerCase() &&
                t.nome.toLowerCase() === row.turma_nome.trim().toLowerCase()
            );

            // Match Disciplina
            const disciplinaMatch = disciplinas.find(d =>
                d.nome.toLowerCase() === row.disciplina.trim().toLowerCase()
            );

            // Match Professor
            const usuarioMatch = usuarios.find(u =>
                u.email.toLowerCase() === row.email_professor.trim().toLowerCase()
            );

            // Match Horario by Index (Aula 1 = index 0)
            const aulaIndex = parseInt(row.aula) - 1;
            let horarioMatch;
            if (!isNaN(aulaIndex) && aulaIndex >= 0 && aulaIndex < horarios.length) {
                horarioMatch = horarios[aulaIndex];
            }

            if (!turmaMatch) {
                errors.push(`Linha ${rowNumber}: Turma '${row.turma_serie} ${row.turma_nome}' não encontrada.`);
                return;
            }
            if (!disciplinaMatch) {
                errors.push(`Linha ${rowNumber}: Disciplina '${row.disciplina}' não encontrada.`);
                return;
            }
            if (!usuarioMatch) {
                errors.push(`Linha ${rowNumber}: Professor com email '${row.email_professor}' não encontrado.`);
                return;
            }
            if (!horarioMatch) {
                errors.push(`Linha ${rowNumber}: Aula número '${row.aula}' não existe nos cadastros de horários.`);
                return;
            }

            const validDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
            const capDay = row.dia_semana.trim();
            let matchedDay = validDays.find(d => d.toLowerCase() === capDay.toLowerCase());

            if (!matchedDay) {
                errors.push(`Linha ${rowNumber}: Dia da semana '${row.dia_semana}' inválido. Use Segunda, Terça, Quarta, Quinta ou Sexta.`);
                return;
            }

            validImports.push({
                turmaId: turmaMatch.id,
                disciplinaId: disciplinaMatch.id,
                usuarioId: usuarioMatch.id,
                dia_semana: matchedDay,
                horario_id: horarioMatch.id
            });
        });

        if (validImports.length === 0) {
            return {
                success: false,
                message: "Nenhuma linha válida encontrada para importar.",
                errors
            };
        }

        // 3. Group by Enturmacao (turma, disciplina, usuario) -> array of schedules
        // To reuse our existing save function or do a bulk insert.
        type GroupedData = Record<string, { dia_semana: string, horario_id: number }[]>;
        const grouped: GroupedData = {};

        validImports.forEach(imp => {
            const key = `${imp.turmaId}_${imp.disciplinaId}_${imp.usuarioId}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            // Add if not already there (preventing duplicates from CSV)
            const exists = grouped[key].some(h => h.dia_semana === imp.dia_semana && h.horario_id === imp.horario_id);
            if (!exists) {
                grouped[key].push({ dia_semana: imp.dia_semana, horario_id: imp.horario_id });
            }
        });

        // 4. Save each group
        // To be safe and reuse logic (upserts enturmacao + drops old schedules + adds new)
        let savedCount = 0;
        for (const [key, schedules] of Object.entries(grouped)) {
            const [turmaId, disciplinaId, usuarioId] = key.split('_');

            // We'll ADD these to existing schedules instead of overwriting, OR overwrite.
            // As CSV usually represents an addition or a full wipe, let's just make it simple: 
            // We fetch existing, merge them, and save.

            const existingSchedulesRes = await supabaseAdmin
                .from("enturmacoes")
                .select("id, enturmacao_horarios(dia_semana, horario_id)")
                .eq("turma_id", turmaId)
                .eq("disciplina_id", disciplinaId)
                .eq("usuario_id", usuarioId)
                .single();

            let mergedSchedules = [...schedules];

            if (existingSchedulesRes.data && existingSchedulesRes.data.enturmacao_horarios) {
                const dbScheds = existingSchedulesRes.data.enturmacao_horarios as { dia_semana: string, horario_id: number }[];
                dbScheds.forEach(dbS => {
                    const alreadyInNew = mergedSchedules.some(ms => ms.dia_semana === dbS.dia_semana && ms.horario_id === dbS.horario_id);
                    if (!alreadyInNew) {
                        mergedSchedules.push(dbS);
                    }
                });
            }

            const res = await saveEnturmacaoSchedules(parseInt(turmaId), parseInt(disciplinaId), usuarioId, mergedSchedules);
            if (!res.error) {
                savedCount += schedules.length; // Count of newly processed slots
            } else {
                errors.push(`Erro ao salvar grupo para Turma ${turmaId}, Disc ${disciplinaId}: ${res.error}`);
            }
        }

        revalidatePath("/settings");
        revalidatePath("/settings/enturmacao");

        return {
            success: true,
            imported: savedCount,
            totalRows: rows.length,
            errors
        };

    } catch (err: any) {
        return { error: err.message };
    }
}
