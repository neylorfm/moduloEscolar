"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function inviteUser(data: { nome: string; email: string; alias?: string; tipo: 'professor' | 'coordenador' | 'administrador' }) {
    try {
        // 1. Criar usuário via Auth Admin com senha padrão
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: "123456",
            email_confirm: true,
            user_metadata: {
                nome: data.nome,
                alias: data.alias,
                tipo: data.tipo,
            },
        });

        if (authError || !authData.user) {
            console.error("Erro ao convidar usuário:", authError?.message);
            return { error: authError?.message || "Erro ao convidar usuário" };
        }

        const userId = authData.user.id;

        // 2. Inserir na tabela 'usuarios'
        const { error: dbError } = await supabaseAdmin.from("usuarios").insert([
            {
                id: userId,
                nome: data.nome,
                email: data.email,
                alias: data.alias,
                tipo: data.tipo,
            },
        ]);

        if (dbError) {
            console.error("Erro ao inserir na tabela usuarios:", dbError.message);
            return { error: dbError.message };
        }

        revalidatePath("/settings/usuarios");
        return { success: true, message: "Usuário convidado com sucesso!" };

    } catch (err: any) {
        console.error("Erro inesperado na Action:", err);
        return { error: "Erro interno no servidor." };
    }
}

export async function updateUser(userId: string, data: { nome?: string; alias?: string; tipo?: 'professor' | 'coordenador' | 'administrador'; avatar_url?: string; password?: string }) {
    try {
        // 1. Atualizar a tabela base
        const { error: dbError } = await supabaseAdmin
            .from("usuarios")
            .update({
                nome: data.nome,
                alias: data.alias,
                tipo: data.tipo,
                avatar_url: data.avatar_url,
            })
            .eq("id", userId);

        if (dbError) {
            console.error("Erro ao atualizar usuário:", dbError.message);
            return { error: dbError.message };
        }

        // 2. Opcionalmente, atualizar a senha na API Auth
        if (data.password && data.password.trim() !== "") {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: data.password }
            );

            if (authError) {
                console.error("Erro ao atualizar senha:", authError.message);
                return { error: `Usuário salvo, mas erro ao mudar a senha: ${authError.message}` };
            }
        }

        revalidatePath("/settings/usuarios");
        return { success: true, message: "Usuário atualizado com sucesso!" };

    } catch (err: any) {
        console.error("Erro inesperado na Action:", err);
        return { error: "Erro interno no servidor." };
    }
}

export async function uploadAvatar(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) return { error: "Nenhum arquivo enviado." };

        // Ensure unique filename
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

        const { data, error } = await supabaseAdmin.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (error) {
            console.error("Erro no upload de avatar:", error.message);
            return { error: error.message };
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return { success: true, url: publicUrlData.publicUrl };

    } catch (err: any) {
        return { error: err.message };
    }
}

export async function getProfessores() {
    try {
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select("id, nome, alias")
            .eq("tipo", "professor")
            .order("nome", { ascending: true });

        if (error) throw error;
        return { data };
    } catch (err: any) {
        return { error: err.message };
    }
}
