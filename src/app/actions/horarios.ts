"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export type TipoHorario = 'Aula' | 'Intervalo' | 'Almoço' | 'Janta';

export interface Horario {
    id: number;
    inicio: string;
    fim: string;
    tipo: TipoHorario;
}

export async function getHorarios(): Promise<{ data?: Horario[], error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from("horarios")
            .select("id, inicio, fim, tipo")
            .order("inicio", { ascending: true });

        if (error) throw error;
        return { data: data || [] };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function addHorario(data: Omit<Horario, 'id'>) {
    try {
        const { error } = await supabaseAdmin
            .from("horarios")
            .insert([data]);

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/horarios");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function updateHorario(id: number, data: Partial<Horario>) {
    try {
        const { error } = await supabaseAdmin
            .from("horarios")
            .update(data)
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/horarios");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function deleteHorario(id: number) {
    try {
        const { error } = await supabaseAdmin
            .from("horarios")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/horarios");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
