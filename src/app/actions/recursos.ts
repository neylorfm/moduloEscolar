"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ==========================================
// RECURSOS
// ==========================================

export type Recurso = {
    id: number;
    nome: string;
    icone: string;
    detalhes: string | null;
    ativo: boolean;
    motivo_inatividade: string | null;
    created_at?: string;
    updated_at?: string;
};

export async function getRecursos(): Promise<{ data?: Recurso[], error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from("recursos")
            .select("*")
            .order("nome");

        if (error) throw error;
        return { data: data as Recurso[] };
    } catch (err: any) {
        console.error("Error fetching recursos:", err.message);
        return { error: err.message };
    }
}

export async function upsertRecurso(
    id: number | null,
    nome: string,
    icone: string,
    detalhes: string | null,
    ativo: boolean,
    motivo_inatividade: string | null
) {
    try {
        // Validation: required motivo if inativo
        if (!ativo && (!motivo_inatividade || motivo_inatividade.trim() === "")) {
            return { error: "Motivo da inatividade é obrigatório quando o recurso está inativo." };
        }

        // Clean up motivo if ativo
        const finalMotivo = ativo ? null : motivo_inatividade;

        if (id) {
            const { error } = await supabaseAdmin
                .from("recursos")
                .update({
                    nome,
                    icone,
                    detalhes,
                    ativo,
                    motivo_inatividade: finalMotivo,
                    updated_at: new Date().toISOString()
                })
                .eq("id", id);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from("recursos")
                .insert([{
                    nome,
                    icone,
                    detalhes,
                    ativo,
                    motivo_inatividade: finalMotivo
                }]);
            if (error) throw error;
        }

        revalidatePath("/settings");
        revalidatePath("/settings/recursos");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function deleteRecurso(id: number) {
    try {
        const { error } = await supabaseAdmin
            .from("recursos")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/recursos");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
