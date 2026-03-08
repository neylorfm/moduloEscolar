"use client";

import { useState } from "react";
import { AreaWithDetails, addArea, updateArea, deleteArea } from "@/app/actions/areas";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, X, Trash2, Save } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface Professor {
    id: string;
    nome: string;
}

export function AreasClient({
    initialAreas,
    professores
}: {
    initialAreas: AreaWithDetails[],
    professores: Professor[]
}) {
    const { profile } = useAuth();
    const isAdmin = profile?.tipo === "administrador";

    const [areas, setAreas] = useState<AreaWithDetails[]>(initialAreas);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // State for temporary edits
    const [editedAreas, setEditedAreas] = useState<AreaWithDetails[]>(initialAreas);

    // State for explicitly adding a new area row
    const [isAdding, setIsAdding] = useState(false);
    const [newAreaRow, setNewAreaRow] = useState<{
        nome: string;
        disciplinas: string[];
        pcaIds: string[];
        tempDiscipInput: string;
    } | null>(null);

    // Temporary input text for disciplines in edit mode (per item)
    const [tempDiscipInputs, setTempDiscipInputs] = useState<Record<number, string>>({});

    const handleEditStart = () => {
        setEditedAreas(JSON.parse(JSON.stringify(areas))); // Deep copy
        setIsEditing(true);
        setIsAdding(false);
        setError("");

        // Reset temp inputs
        const initialTemp = {};
        areas.forEach(a => {
            (initialTemp as any)[a.id] = "";
        });
        setTempDiscipInputs(initialTemp);
    };

    const handleCancel = () => {
        setEditedAreas(JSON.parse(JSON.stringify(areas))); // Deep copy
        setIsEditing(false);
        setIsAdding(false);
        setNewAreaRow(null);
        setError("");
    };

    const handleStartAdd = () => {
        setError("");
        setNewAreaRow({
            nome: "",
            disciplinas: [],
            pcaIds: [],
            tempDiscipInput: ""
        });
        setIsAdding(true);
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewAreaRow(null);
        setError("");
    };

    // --- New Row Helpers ---
    const handleAddDiscipToNewRow = () => {
        if (!newAreaRow || !newAreaRow.tempDiscipInput.trim()) return;
        const discip = newAreaRow.tempDiscipInput.trim();
        if (!newAreaRow.disciplinas.includes(discip)) {
            setNewAreaRow({
                ...newAreaRow,
                disciplinas: [...newAreaRow.disciplinas, discip],
                tempDiscipInput: ""
            });
        }
    };

    const handleRemoveDiscipFromNewRow = (discip: string) => {
        if (!newAreaRow) return;
        setNewAreaRow({
            ...newAreaRow,
            disciplinas: newAreaRow.disciplinas.filter(d => d !== discip)
        });
    };

    const handleTogglePcaInNewRow = (pcaId: string) => {
        if (!newAreaRow) return;
        const currentIds = newAreaRow.pcaIds;
        setNewAreaRow({
            ...newAreaRow,
            pcaIds: currentIds.includes(pcaId)
                ? currentIds.filter(id => id !== pcaId)
                : [...currentIds, pcaId]
        });
    };

    const handleSaveNewRow = async () => {
        if (!newAreaRow) return;
        if (!newAreaRow.nome.trim()) {
            setError("O nome da área é obrigatório.");
            return;
        }

        setError("");
        setSaving(true);
        const res = await addArea(newAreaRow.nome, newAreaRow.disciplinas, newAreaRow.pcaIds);

        if (res.error) {
            setError(res.error);
            setSaving(false);
            return;
        }

        // Fetch the updated list to populate IDs correctly
        const { getAreas } = await import("@/app/actions/areas");
        const resData = await getAreas();
        if (resData.data) {
            setAreas(resData.data);
            setEditedAreas(JSON.parse(JSON.stringify(resData.data)));
        }

        setIsAdding(false);
        setNewAreaRow(null);
        setSaving(false);
    };

    // --- Edit Row Helpers ---
    const handleUpdateAreaName = (id: number, nome: string) => {
        setEditedAreas(editedAreas.map(a => a.id === id ? { ...a, nome } : a));
    };

    const handleAddDiscipToEditRow = (id: number) => {
        const input = tempDiscipInputs[id]?.trim();
        if (!input) return;

        setEditedAreas(editedAreas.map(a => {
            if (a.id === id && !a.disciplinas.some(d => d.nome === input)) {
                return {
                    ...a,
                    disciplinas: [...a.disciplinas, { id: Date.now(), area_id: id, nome: input }]
                };
            }
            return a;
        }));

        setTempDiscipInputs({ ...tempDiscipInputs, [id]: "" });
    };

    const handleRemoveDiscipFromEditRow = (areaId: number, discipNome: string) => {
        setEditedAreas(editedAreas.map(a => {
            if (a.id === areaId) {
                return {
                    ...a,
                    disciplinas: a.disciplinas.filter(d => d.nome !== discipNome)
                };
            }
            return a;
        }));
    };

    const handleTogglePcaInEditRow = (areaId: number, pcaId: string) => {
        setEditedAreas(editedAreas.map(a => {
            if (a.id === areaId) {
                const hasPca = a.pcas.some(p => p.usuario_id === pcaId);
                const prof = professores.find(p => p.id === pcaId);

                if (hasPca) {
                    return { ...a, pcas: a.pcas.filter(p => p.usuario_id !== pcaId) };
                } else if (prof) {
                    return { ...a, pcas: [...a.pcas, { usuario_id: pcaId, nome: prof.nome }] };
                }
            }
            return a;
        }));
    };

    const handleSaveEditRow = async (id: number) => {
        const areaToSave = editedAreas.find(a => a.id === id);
        if (!areaToSave) return;

        if (!areaToSave.nome.trim()) {
            setError("O nome da área é obrigatório.");
            return;
        }

        setError("");
        setSaving(true);

        const discipNames = areaToSave.disciplinas.map(d => d.nome);
        const pcaIds = areaToSave.pcas.map(p => p.usuario_id);

        const res = await updateArea(id, areaToSave.nome, discipNames, pcaIds);

        if (res.error) {
            setError(res.error);
            setSaving(false);
            return;
        }

        const { getAreas } = await import("@/app/actions/areas");
        const resData = await getAreas();
        if (resData.data) {
            setAreas(resData.data);
            setEditedAreas(JSON.parse(JSON.stringify(resData.data)));
        }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja apagar esta área? Isso excluirá as disciplinas associadas também.")) return;

        setError("");
        setSaving(true);
        const res = await deleteArea(id);
        if (res.error) {
            setError(res.error);
            setSaving(false);
        } else {
            // Force reload to completely reset UI state and inputs safely
            window.location.reload();
        }
    };

    const activeList = isEditing ? editedAreas : areas;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    Estrutura de Áreas
                </h3>
                {isAdmin && (
                    <div>
                        {!isEditing ? (
                            <Button onClick={handleEditStart} variant="outline" size="sm" className="gap-2">
                                <Edit2 className="w-4 h-4" />
                                Modo Edição
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button onClick={handleCancel} variant="ghost" size="sm" className="gap-2 text-slate-500" disabled={saving}>
                                    <X className="w-4 h-4" />
                                    Concluir Edição
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 md:p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-zinc-400">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-500">
                            <tr>
                                <th className="px-4 py-3 font-medium min-w-[150px]">Nome da Área</th>
                                <th className="px-4 py-3 font-medium min-w-[200px]">Disciplinas</th>
                                <th className="px-4 py-3 font-medium min-w-[200px]">Prof. Coord. de Área (PCA)</th>
                                {isEditing && <th className="px-4 py-3 font-medium text-right min-w-[100px]">Ação</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                            {activeList.length === 0 && !isAdding ? (
                                <tr>
                                    <td colSpan={isEditing ? 4 : 3} className="px-4 py-8 text-center text-slate-400">
                                        Nenhuma área cadastrada.
                                    </td>
                                </tr>
                            ) : (
                                activeList.map((area) => (
                                    <tr key={area.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        {/* Nome */}
                                        <td className="px-4 py-3 align-top">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={area.nome}
                                                    onChange={(e) => handleUpdateAreaName(area.id, e.target.value)}
                                                    placeholder="Nome da Área"
                                                    className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                <span className="font-medium text-slate-900 dark:text-zinc-100">{area.nome}</span>
                                            )}
                                        </td>

                                        {/* Disciplinas */}
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {area.disciplinas.length === 0 && !isEditing && (
                                                    <span className="text-xs text-slate-400">Sem disciplinas</span>
                                                )}
                                                {area.disciplinas.map(d => (
                                                    <span key={d.nome} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                        {d.nome}
                                                        {isEditing && (
                                                            <button
                                                                onClick={() => handleRemoveDiscipFromEditRow(area.id, d.nome)}
                                                                className="hover:text-red-500"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                            {isEditing && (
                                                <div className="flex gap-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Nova disciplina"
                                                        value={tempDiscipInputs[area.id] || ""}
                                                        onChange={(e) => setTempDiscipInputs({ ...tempDiscipInputs, [area.id]: e.target.value })}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddDiscipToEditRow(area.id);
                                                            }
                                                        }}
                                                        className="flex-1 min-w-[100px] text-xs px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-indigo-500"
                                                    />
                                                    <Button
                                                        onClick={() => handleAddDiscipToEditRow(area.id)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-auto py-1 px-2 text-xs"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>

                                        {/* PCAs */}
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {area.pcas.length === 0 && !isEditing && (
                                                    <span className="text-xs text-slate-400">Sem PCA definido</span>
                                                )}
                                                {area.pcas.map(pca => (
                                                    <span key={pca.usuario_id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                                        {pca.nome}
                                                        {isEditing && (
                                                            <button
                                                                onClick={() => handleTogglePcaInEditRow(area.id, pca.usuario_id)}
                                                                className="hover:text-amber-900 dark:hover:text-amber-200"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>

                                            {isEditing && (
                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleTogglePcaInEditRow(area.id, e.target.value);
                                                            e.target.value = ""; // Reset selector
                                                        }
                                                    }}
                                                    className="w-full text-xs px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Adicionar PCA...</option>
                                                    {professores.map(prof => (
                                                        <option key={prof.id} value={prof.id} disabled={area.pcas.some(p => p.usuario_id === prof.id)}>
                                                            {prof.nome}
                                                        </option>
                                                    ))}
                                                    {professores.length === 0 && (
                                                        <option value="" disabled>Nenhum professor encontrado</option>
                                                    )}
                                                </select>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        {isEditing && (
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        onClick={() => handleDelete(area.id)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                        disabled={saving || isAdding}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSaveEditRow(area.id)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8"
                                                        disabled={saving}
                                                        title="Salvar alterações desta área"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}

                            {/* New Row Form */}
                            {isEditing && isAdding && newAreaRow && (
                                <tr className="bg-indigo-50/50 dark:bg-indigo-500/5">
                                    <td className="px-4 py-3 align-top">
                                        <div className="mb-1 text-xs text-indigo-500 font-medium">Nova Área</div>
                                        <input
                                            type="text"
                                            value={newAreaRow.nome}
                                            onChange={(e) => setNewAreaRow({ ...newAreaRow, nome: e.target.value })}
                                            placeholder="Ex: Ciências Humanas"
                                            className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {newAreaRow.disciplinas.map(d => (
                                                <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                    {d}
                                                    <button
                                                        onClick={() => handleRemoveDiscipFromNewRow(d)}
                                                        className="hover:text-red-500"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                placeholder="Nova disciplina..."
                                                value={newAreaRow.tempDiscipInput}
                                                onChange={(e) => setNewAreaRow({ ...newAreaRow, tempDiscipInput: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddDiscipToNewRow();
                                                    }
                                                }}
                                                className="flex-1 min-w-[100px] text-xs px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 focus:ring-indigo-500"
                                            />
                                            <Button
                                                onClick={handleAddDiscipToNewRow}
                                                variant="secondary"
                                                size="sm"
                                                className="h-auto py-1 px-2 text-xs"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {newAreaRow.pcaIds.map(pcaId => {
                                                const prof = professores.find(p => p.id === pcaId);
                                                return prof ? (
                                                    <span key={pcaId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                                        {prof.nome}
                                                        <button
                                                            onClick={() => handleTogglePcaInNewRow(pcaId)}
                                                            className="hover:text-amber-900 dark:hover:text-amber-200"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleTogglePcaInNewRow(e.target.value);
                                                    e.target.value = "";
                                                }
                                            }}
                                            className="w-full text-xs px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Adicionar PCA...</option>
                                            {professores.map(prof => (
                                                <option key={prof.id} value={prof.id} disabled={newAreaRow.pcaIds.includes(prof.id)}>
                                                    {prof.nome}
                                                </option>
                                            ))}
                                            {professores.length === 0 && (
                                                <option value="" disabled>Nenhum professor encontrado</option>
                                            )}
                                        </select>
                                    </td>

                                    <td className="px-4 py-3 align-top text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                onClick={handleCancelAdd}
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 w-8"
                                                disabled={saving}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                onClick={handleSaveNewRow}
                                                variant="ghost"
                                                size="icon"
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8"
                                                disabled={saving}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {isEditing && !isAdding && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/50 flex justify-center">
                        <Button
                            onClick={handleStartAdd}
                            disabled={saving}
                            variant="outline"
                            className="bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-dashed border-2 gap-2 w-full max-w-sm text-slate-600 dark:text-zinc-300"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Área
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
