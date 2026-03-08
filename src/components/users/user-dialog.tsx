"use client";

import { useState } from "react";
import { inviteUser, updateUser, uploadAvatar } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserDialogProps {
    mode: "create" | "edit";
    userData?: any;
}

export function UserDialog({ mode, userData }: UserDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>(userData?.avatar_url || "");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const formData = new FormData(e.currentTarget);
        const nome = formData.get("nome") as string;
        const email = formData.get("email") as string;
        const alias = formData.get("alias") as string;
        const tipo = formData.get("tipo") as "professor" | "coordenador" | "administrador";
        const password = formData.get("password") as string;

        try {
            let finalAvatarUrl = userData?.avatar_url;

            if (file) {
                const uploadForm = new FormData();
                uploadForm.append("file", file);
                const uploadRes = await uploadAvatar(uploadForm);

                if (uploadRes.error) throw new Error(uploadRes.error);
                finalAvatarUrl = uploadRes.url;
            }

            if (mode === "create") {
                const res = await inviteUser({ nome, email, alias, tipo });
                if (res.error) throw new Error(res.error);

                setSuccess(res.message || "Usuário criado com sucesso!");
            } else {
                const payload: any = { nome, alias, tipo, avatar_url: finalAvatarUrl };
                if (password && password.trim() !== "") {
                    payload.password = password;
                }

                const res = await updateUser(userData.id, payload);
                if (res.error) throw new Error(res.error);
                setSuccess(res.message || "Usuário atualizado com sucesso!");
            }

            // Close modal gracefully
            setTimeout(() => setIsOpen(false), 1500);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                variant={mode === "create" ? "default" : "outline"}
                size={mode === "create" ? "default" : "sm"}
                className={mode === "create" ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" : ""}
            >
                {mode === "create" ? "Novo Usuário" : "Editar"}
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-zinc-100">

                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-zinc-800">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                                {mode === "create" ? "Convidar Usuário" : "Editar Usuário"}
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                            {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100">{success}</div>}

                            <div className="space-y-4">
                                {/* Foto / Avatar Upload */}
                                <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50">
                                    <Avatar className="h-20 w-20 mb-3 shadow-sm border-2 border-white dark:border-zinc-800">
                                        <AvatarImage src={preview || ""} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg">
                                            {userData?.nome ? userData.nome.charAt(0).toUpperCase() : "?"}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={onFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Button type="button" variant="secondary" size="sm" className="pointer-events-none">
                                            <UploadCloud className="w-4 h-4 mr-2" />
                                            Trocar Foto
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Nome Completo *</label>
                                    <input required name="nome" defaultValue={userData?.nome} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Email * {mode === "edit" && "(Não editável via painel)"}</label>
                                    <input required type="email" name="email" defaultValue={userData?.email} disabled={mode === "edit"} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Como deseja ser chamado</label>
                                    <input name="alias" defaultValue={userData?.alias} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                                </div>

                                {mode === "edit" && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Nova Senha (deixe em branco para manter a atual)</label>
                                        <input type="password" name="password" placeholder="••••••••" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Papel / Nível *</label>
                                    <select required name="tipo" defaultValue={userData?.tipo || "professor"} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500">
                                        <option value="professor">Professor</option>
                                        <option value="coordenador">Coordenador</option>
                                        <option value="administrador">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
