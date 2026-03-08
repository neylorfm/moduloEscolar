"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type Area = {
    id: number;
    nome: string;
};

export type Disciplina = {
    id: number;
    area_id: number;
    nome: string;
};

export type AreaPca = {
    area_id: number;
    usuario_id: string;
};

// Joined view type for the frontend
export type AreaWithDetails = Area & {
    disciplinas: Disciplina[];
    pcas: {
        usuario_id: string;
        nome: string; // Fetched from public.usuarios
    }[];
};

export async function getAreas(): Promise<{ data?: AreaWithDetails[], error?: string }> {
    try {
        // Fetch all areas
        const { data: areas, error: areasError } = await supabaseAdmin
            .from("areas")
            .select("*")
            .order("nome", { ascending: true });

        if (areasError) throw areasError;

        // Fetch all disciplinas
        const { data: disciplinas, error: discipError } = await supabaseAdmin
            .from("disciplinas")
            .select("*");

        if (discipError) throw discipError;

        // Fetch PCAs with user names
        const { data: pcas, error: pcasError } = await supabaseAdmin
            .from("area_pcas")
            .select(`
                area_id,
                usuario_id,
                usuarios:usuario_id (nome)
            `);

        if (pcasError) throw pcasError;

        // Map and structure the response
        const areasWithDetails: AreaWithDetails[] = (areas || []).map(area => ({
            ...area,
            disciplinas: (disciplinas || []).filter(d => d.area_id === area.id),
            pcas: (pcas || [])
                .filter(pca => pca.area_id === area.id)
                .map(pca => ({
                    usuario_id: pca.usuario_id,
                    // Handle postgrest foreign key array wrapping logic
                    nome: Array.isArray(pca.usuarios)
                        ? pca.usuarios[0]?.nome
                        : (pca.usuarios as any)?.nome || "Desconhecido"
                }))
        }));

        return { data: areasWithDetails };
    } catch (err: any) {
        console.error("Error fetching areas:", err.message);
        return { error: err.message };
    }
}

export async function addArea(nome: string, disciplinas: string[], pcaIds: string[]) {
    try {
        // 1. Insert Area
        const { data: area, error: areaError } = await supabaseAdmin
            .from("areas")
            .insert([{ nome }])
            .select()
            .single();

        if (areaError) throw areaError;

        const areaId = area.id;

        // 2. Insert Disciplinas
        if (disciplinas.length > 0) {
            const discipData = disciplinas.map(d => ({ area_id: areaId, nome: d }));
            const { error: dError } = await supabaseAdmin.from("disciplinas").insert(discipData);
            if (dError) throw dError;
        }

        // 3. Insert PCAs
        if (pcaIds.length > 0) {
            const pcaData = pcaIds.map(uid => ({ area_id: areaId, usuario_id: uid }));
            const { error: pError } = await supabaseAdmin.from("area_pcas").insert(pcaData);
            if (pError) throw pError;
        }

        revalidatePath("/settings");
        revalidatePath("/settings/areas");
        return { success: true, data: area };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function updateArea(areaId: number, nome: string, disciplinas: string[], pcaIds: string[]) {
    try {
        // 1. Update Area Name
        const { error: areaError } = await supabaseAdmin
            .from("areas")
            .update({ nome })
            .eq("id", areaId);

        if (areaError) throw areaError;

        // 2. Refresh Disciplinas (Delete all, Insert new)
        const { error: delDiscipError } = await supabaseAdmin
            .from("disciplinas")
            .delete()
            .eq("area_id", areaId);
        if (delDiscipError) throw delDiscipError;

        if (disciplinas.length > 0) {
            const discipData = disciplinas.map(d => ({ area_id: areaId, nome: d }));
            const { error: insDiscipError } = await supabaseAdmin.from("disciplinas").insert(discipData);
            if (insDiscipError) throw insDiscipError;
        }

        // 3. Refresh PCAs (Delete all, Insert new)
        const { error: delPcaError } = await supabaseAdmin
            .from("area_pcas")
            .delete()
            .eq("area_id", areaId);
        if (delPcaError) throw delPcaError;

        if (pcaIds.length > 0) {
            const pcaData = pcaIds.map(uid => ({ area_id: areaId, usuario_id: uid }));
            const { error: insPcaError } = await supabaseAdmin.from("area_pcas").insert(pcaData);
            if (insPcaError) throw insPcaError;
        }

        revalidatePath("/settings");
        revalidatePath("/settings/areas");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function deleteArea(areaId: number) {
    try {
        // Cascade delete on the DB handles child records
        const { error } = await supabaseAdmin
            .from("areas")
            .delete()
            .eq("id", areaId);

        if (error) throw error;

        revalidatePath("/settings");
        revalidatePath("/settings/areas");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

// Helper to fetch all professor users for the PCA selection dropdown
export async function getProfessores(): Promise<{ data?: { id: string, nome: string }[], error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select("id, nome")
            .eq("tipo", "professor")
            .order("nome", { ascending: true });

        if (error) throw error;
        return { data };
    } catch (err: any) {
        return { error: err.message };
    }
}
