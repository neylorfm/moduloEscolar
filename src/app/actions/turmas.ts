"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type SerieTurma = "1º ANO" | "2º ANO" | "3º ANO";

export type Turma = {
    id: number;
    serie: SerieTurma;
    nome: string;
};

export async function getTurmas(): Promise<{ data?: Turma[], error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from("turmas")
            .select("*")
            .order("serie", { ascending: true })
            .order("nome", { ascending: true });

        if (error) throw error;
        return { data: data as Turma[] };
    } catch (err: any) {
        console.error("Error fetching turmas:", err.message);
        return { error: err.message };
    }
}

export async function addTurma(turma: Omit<Turma, 'id'>) {
    try {
        const { error } = await supabaseAdmin
            .from("turmas")
            .insert([turma]);

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/turmas");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function updateTurma(id: number, data: Partial<Omit<Turma, 'id'>>) {
    try {
        const { error } = await supabaseAdmin
            .from("turmas")
            .update(data)
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/turmas");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function deleteTurma(id: number) {
    try {
        const { error } = await supabaseAdmin
            .from("turmas")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/turmas");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
