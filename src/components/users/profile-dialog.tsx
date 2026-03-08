"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // O Avatar do próprio usuário. Futuramente poderíamos colocar upload.
    const preview = profile?.avatar_url || "";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!profile) return;

        setLoading(true);
        setError("");
        setSuccess("");

        const formData = new FormData(e.currentTarget);
        const nome = formData.get("nome") as string;
        const alias = formData.get("alias") as string;
        const password = formData.get("password") as string;

        try {
            // 1. Atualizar Tabela Públicos (Nome, Apelido) via Client usando RLS para garantir segurança
            const updatePayload: any = {};
            if (nome) updatePayload.nome = nome;
            if (alias !== null) updatePayload.alias = alias; // Alias pode estar vazio, então checamos null

            if (Object.keys(updatePayload).length > 0) {
                const { error: dbError } = await supabase
                    .from("usuarios")
                    .update(updatePayload)
                    .eq("id", profile.id);

                if (dbError) throw new Error("Erro ao atualizar dados básicos: " + dbError.message);
            }

            // 2. Atualizar Senha via Supabase Auth Client
            if (password && password.trim() !== "") {
                const { error: authError } = await supabase.auth.updateUser({ password });
                if (authError) {
                    throw new Error("Erro ao atualizar senha: " + authError.message);
                }
            }

            setSuccess("Perfil atualizado com sucesso!");
            setTimeout(() => onClose(), 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !profile) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-zinc-100">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-zinc-800">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                        Meu Perfil
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                    {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100">{success}</div>}

                    <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center mb-4">
                            <Avatar className="h-20 w-20 mb-3 shadow-sm border-2 border-white dark:border-zinc-800">
                                <AvatarImage src={preview || ""} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg">
                                    {profile?.nome ? profile.nome.charAt(0).toUpperCase() : "?"}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Nome Completo</label>
                            <input name="nome" defaultValue={profile?.nome} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Como deseja ser chamado</label>
                            <input name="alias" defaultValue={profile?.alias || ""} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Nova Senha</label>
                            <input type="password" name="password" placeholder="(Deixe em branco para não alterar)" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Perfil"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
