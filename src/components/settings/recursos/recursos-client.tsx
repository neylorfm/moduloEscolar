"use client";

import { useState } from "react";
import { Recurso, upsertRecurso, deleteRecurso, getRecursos } from "@/app/actions/recursos";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, X, Loader2, Save, BadgeInfo } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";

// Define strict typing for dynamic icon usage to prevent invalid renders
type IconName = keyof typeof LucideIcons;

// Safe Icon renderer component
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    // Check if the icon name exists in lucide-react exports
    const IconComponent = (LucideIcons as any)[name];

    // Fallback to a default generic icon if it doesn't exist
    if (!IconComponent) {
        return <BadgeInfo className={className} />;
    }

    return <IconComponent className={className} />;
};

export function RecursosClient({
    initialRecursos
}: {
    initialRecursos: Recurso[]
}) {
    const [recursos, setRecursos] = useState<Recurso[]>(initialRecursos);

    // Loading States
    const [loading, setLoading] = useState(false);

    // Recurso Manager State
    const [editingRecurso, setEditingRecurso] = useState<Recurso | null>(null);
    const [isCreatingRecurso, setIsCreatingRecurso] = useState(false);

    // Form states Recurso
    const [rNome, setRNome] = useState("");
    const [rIcone, setRIcone] = useState("Box");
    const [rDetalhes, setRDetalhes] = useState("");
    const [rAtivo, setRAtivo] = useState(true);
    const [rMotivo, setRMotivo] = useState("");

    const refreshData = async () => {
        setLoading(true);
        const rRes = await getRecursos();
        if (rRes.data) setRecursos(rRes.data);
        setLoading(false);
    };

    // --- Recurso Logic ---
    const handleOpenCreateRecurso = () => {
        setRNome("");
        setRIcone("Box");
        setRDetalhes("");
        setRAtivo(true);
        setRMotivo("");
        setIsCreatingRecurso(true);
        setEditingRecurso(null);
    };

    const handleOpenEditRecurso = (r: Recurso) => {
        setRNome(r.nome);
        setRIcone(r.icone);
        setRDetalhes(r.detalhes || "");
        setRAtivo(r.ativo);
        setRMotivo(r.motivo_inatividade || "");
        setEditingRecurso(r);
        setIsCreatingRecurso(false);
    };

    const handleSaveRecurso = async () => {
        if (!rNome.trim() || !rIcone.trim()) {
            toast.error("Nome e Ícone são obrigatórios.");
            return;
        }

        if (!rAtivo && !rMotivo.trim()) {
            toast.error("Motivo da inatividade é obrigatório.");
            return;
        }

        setLoading(true);
        const res = await upsertRecurso(
            editingRecurso?.id || null,
            rNome,
            rIcone,
            rDetalhes,
            rAtivo,
            rMotivo
        );

        if (res.error) {
            toast.error("Erro ao salvar recurso: " + res.error);
        } else {
            toast.success("Recurso salvo com sucesso!");
            await refreshData();
            setIsCreatingRecurso(false);
            setEditingRecurso(null);
        }
        setLoading(false);
    };

    const handleDeleteRecurso = async (id: number) => {
        if (!confirm("Tem certeza que deseja apagar este recurso permanentemente?")) return;

        setLoading(true);
        const res = await deleteRecurso(id);
        if (res.error) {
            toast.error("Erro ao apagar: " + res.error);
        } else {
            toast.success("Recurso excluído com sucesso!");
            await refreshData();
            if (editingRecurso?.id === id) setEditingRecurso(null);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-slate-500 dark:text-zinc-400">
                    Gerencie os laboratórios, salas de vídeo, quadras e outros espaços.
                </p>
                <div className="flex gap-2">
                    <Button onClick={handleOpenCreateRecurso} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Recurso
                    </Button>
                </div>
            </div>

            {/* List of Recursos */}
            {recursos.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-8 text-center text-slate-500">
                    Nenhum recurso cadastrado ainda. Adicione o primeiro!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recursos.map(recurso => {
                        return (
                            <div key={recurso.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-shadow relative group overflow-hidden">
                                {recurso.ativo ? (
                                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                                        <div className="absolute transform rotate-45 bg-emerald-500 text-white text-[10px] font-bold py-1 right-[-35px] top-[15px] w-[130px] text-center shadow-sm">
                                            ATIVO
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                                        <div className="absolute transform rotate-45 bg-red-500 text-white text-[10px] font-bold py-1 right-[-35px] top-[15px] w-[130px] text-center shadow-sm">
                                            INATIVO
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-4 mb-4 mt-2">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <DynamicIcon name={recurso.icone || 'Box'} className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 pr-2 break-words" title={recurso.nome}>
                                            {recurso.nome}
                                        </h3>
                                    </div>
                                </div>

                                {recurso.detalhes && (
                                    <div className="mb-4 text-sm text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 line-clamp-2" title={recurso.detalhes}>
                                        {recurso.detalhes}
                                    </div>
                                )}

                                {!recurso.ativo && (
                                    <div className="mb-4 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                        <span className="font-semibold">Motivo: </span>{recurso.motivo_inatividade}
                                    </div>
                                )}

                                <div className="flex gap-2 justify-end mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" onClick={() => handleOpenEditRecurso(recurso)}>
                                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRecurso(recurso.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL: CRIAR/EDITAR RECURSO */}
            {(isCreatingRecurso || editingRecurso) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                                {isCreatingRecurso ? "Adicionar Novo Recurso" : "Editar Recurso"}
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Nome do Recurso *</label>
                                <input
                                    type="text"
                                    value={rNome}
                                    onChange={e => setRNome(e.target.value)}
                                    placeholder="Ex: Laboratório de Informática 1, Quadra Norte..."
                                    className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                                    Ícone (Lucide React) <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline inline-flex items-center ml-1">(Ver Lista)</a> *
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={rIcone}
                                        onChange={e => setRIcone(e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ex: Monitor, BookOpen..."
                                    />
                                    <div className="p-2.5 bg-slate-100 dark:bg-zinc-800 rounded-lg border shadow-inner">
                                        <DynamicIcon name={rIcone} className="w-5 h-5 text-indigo-600" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Digite o nome exato do ícone em PascalCase. Ex: 'Video', 'Monitor', 'Trophy'.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Detalhes / Especificações</label>
                                <textarea
                                    value={rDetalhes}
                                    onChange={e => setRDetalhes(e.target.value)}
                                    placeholder="Ex: Bloco C, Capacidade 30 alunos, Computadores Positivo..."
                                    className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                                />
                            </div>

                            <div className="pt-2 border-t mt-4">
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-lg border transition-colors hover:border-slate-300 shadow-sm">
                                    <input
                                        type="checkbox"
                                        checked={rAtivo}
                                        onChange={e => {
                                            setRAtivo(e.target.checked);
                                            if (e.target.checked) setRMotivo("");
                                        }}
                                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div>
                                        <span className="font-medium text-slate-800 dark:text-zinc-200">Recurso Ativo e Operacional</span>
                                        <p className="text-xs text-slate-500">Desmarque se o recurso estiver em manutenção ou desativado.</p>
                                    </div>
                                </label>
                            </div>

                            {!rAtivo && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">Motivo da Inatividade *</label>
                                    <textarea
                                        value={rMotivo}
                                        onChange={e => setRMotivo(e.target.value)}
                                        placeholder="Ex: Indisponível devido à reforma do teto. Previsão de retorno: mês que vem."
                                        className="w-full px-4 py-2 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setIsCreatingRecurso(false); setEditingRecurso(null); }}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveRecurso} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Salvar Recurso
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
