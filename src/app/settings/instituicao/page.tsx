"use client";

import { useEffect, useState } from "react";
import { getInstituicao, updateInstituicao, uploadLogo } from "@/app/actions/instituicao";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, Save } from "lucide-react";

export default function InstituicaoSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        async function fetchConfig() {
            const res = await getInstituicao();
            if (res.data) {
                setData(res.data);
                setPreview(res.data.logotipo_url || "");
            }
            setLoading(false);
        }
        fetchConfig();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const formData = new FormData(e.currentTarget);
            let logoUrl = data.logotipo_url;

            if (file) {
                const uploadForm = new FormData();
                uploadForm.append("file", file);
                const uploadRes = await uploadLogo(uploadForm);
                if (uploadRes.error) throw new Error(uploadRes.error);
                logoUrl = uploadRes.url;
            }

            const payload = {
                nome: formData.get("nome") as string,
                logotipo_url: logoUrl,
                cor_1: formData.get("cor_1") as string,
                cor_2: formData.get("cor_2") as string,
                cor_3: formData.get("cor_3") as string,
                cor_4: formData.get("cor_4") as string,
                cor_5: formData.get("cor_5") as string,
                logout_professor: Number(formData.get("logout_professor")),
                logout_coordenador: Number(formData.get("logout_coordenador")),
                logout_administrador: Number(formData.get("logout_administrador")),
            };

            const res = await updateInstituicao(payload);
            if (res.error) throw new Error(res.error);

            setMessage({ type: "success", text: "Configurações atualizadas com sucesso! A página pode recarregar para aplicar o visual." });
            setData({ ...payload, logotipo_url: logoUrl });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 p-6 md:p-8">
            <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-zinc-100">Escola & Visual</h2>
                <p className="text-sm text-slate-500 mt-1 dark:text-zinc-400">
                    Defina o nome da sua instituição, logotipo, paleta de cores e limites de sessão.
                </p>
            </div>

            {message.text && (
                <div className={`mt-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-8 max-w-2xl">

                {/* Visual Section */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Logotipo da Instituição</label>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-zinc-700 flex items-center justify-center bg-slate-50 dark:bg-zinc-800 overflow-hidden">
                                {preview ? (
                                    <img src={preview} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-slate-400 text-sm">Sem Logo</span>
                                )}
                            </div>
                            <div>
                                <div className="relative inline-block">
                                    <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                                        <UploadCloud className="w-4 h-4 mr-2" />
                                        Alterar Imagem
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Recomendado: fundo transparente (PNG)</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Nome de Exibição</label>
                        <input required name="nome" defaultValue={data?.nome} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Ex: Escola Técnica Alpha" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Paleta de Cores (Opcional)</label>
                        <p className="text-xs text-slate-500 mb-3">Escolha as cores que predominarão no sistema e no Login.</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Cor Principal</label>
                                <input type="color" name="cor_1" defaultValue={data?.cor_1} className="w-full h-10 cursor-pointer rounded border border-slate-200" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Cor Secundária 1</label>
                                <input type="color" name="cor_2" defaultValue={data?.cor_2} className="w-full h-10 cursor-pointer rounded border border-slate-200" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Cor Secundária 2</label>
                                <input type="color" name="cor_3" defaultValue={data?.cor_3} className="w-full h-10 cursor-pointer rounded border border-slate-200" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Cor de Destaque 1</label>
                                <input type="color" name="cor_4" defaultValue={data?.cor_4} className="w-full h-10 cursor-pointer rounded border border-slate-200" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Cor de Destaque 2</label>
                                <input type="color" name="cor_5" defaultValue={data?.cor_5} className="w-full h-10 cursor-pointer rounded border border-slate-200" />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-zinc-800" />

                {/* Security Section */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-zinc-100 mb-1">Segurança e Sessões</h3>
                        <p className="text-sm text-slate-500 mb-4">Defina o tempo limite (em minutos) antes que os usuários precisem fazer login novamente.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Professor (min)</label>
                            <input type="number" min="5" required name="logout_professor" defaultValue={data?.logout_professor} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Coordenador (min)</label>
                            <input type="number" min="5" required name="logout_coordenador" defaultValue={data?.logout_coordenador} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Administrador (min)</label>
                            <input type="number" min="5" required name="logout_administrador" defaultValue={data?.logout_administrador} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" />
                            <p className="text-xs text-slate-500 mt-1">Recomendado tempos mais curtos para segurança alta.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                    <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
