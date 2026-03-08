"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function getInstituicao() {
    try {
        const { data, error } = await supabaseAdmin
            .from("instituicao")
            .select("*")
            .eq("id", 1)
            .single();

        if (error) throw error;
        return { data };
    } catch (err: any) {
        console.error("Erro ao buscar instituição:", err.message);
        return { error: err.message };
    }
}

export async function updateInstituicao(data: {
    nome: string;
    cor_1: string;
    cor_2: string;
    cor_3: string;
    cor_4: string;
    cor_5: string;
    logout_professor: number;
    logout_coordenador: number;
    logout_administrador: number;
    logotipo_url?: string;
}) {
    try {
        const { error } = await supabaseAdmin
            .from("instituicao")
            .update(data)
            .eq("id", 1);

        if (error) throw error;

        revalidatePath("/", "layout"); // Revalidate everything to update sidebar and login
        return { success: true, message: "Instituição atualizada com sucesso!" };
    } catch (err: any) {
        console.error("Erro ao atualizar instituição:", err.message);
        return { error: err.message };
    }
}

export async function uploadLogo(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) return { error: "Nenhum arquivo enviado." };

        const ext = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${ext}`;

        const { data, error } = await supabaseAdmin.storage
            .from('avatars') // Resusing avatars bucket for logo for simplicity, or we could create 'assets'
            .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data: publicUrlData } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return { success: true, url: publicUrlData.publicUrl };

    } catch (err: any) {
        return { error: err.message };
    }
}
