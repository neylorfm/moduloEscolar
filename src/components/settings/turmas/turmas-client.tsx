"use client";

import { useState } from "react";
import { Turma, SerieTurma, addTurma, updateTurma, deleteTurma } from "@/app/actions/turmas";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, X, Trash2, Save } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export function TurmasClient({ initialTurmas }: { initialTurmas: Turma[] }) {
    const { profile } = useAuth();
    const isAdmin = profile?.tipo === "administrador";

    const [turmas, setTurmas] = useState<Turma[]>(initialTurmas);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Temporary state for the edit mode
    const [editedTurmas, setEditedTurmas] = useState<Turma[]>(initialTurmas);

    // State for explicitly adding a new row
    const [isAdding, setIsAdding] = useState(false);
    const [newRow, setNewRow] = useState<Omit<Turma, 'id'> | null>(null);

    const handleEditStart = () => {
        setEditedTurmas([...turmas]);
        setIsEditing(true);
        setIsAdding(false);
        setError("");
    };

    const handleCancel = () => {
        setEditedTurmas([...turmas]);
        setIsEditing(false);
        setIsAdding(false);
        setNewRow(null);
        setError("");
    };

    const handleStartAdd = () => {
        setError("");

        let newSerie: SerieTurma = "1º ANO";
        if (editedTurmas.length > 0) {
            newSerie = editedTurmas[editedTurmas.length - 1].serie;
        }

        setNewRow({
            serie: newSerie,
            nome: ""
        });
        setIsAdding(true);
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewRow(null);
        setError("");
    };

    const handleSaveNewRow = async () => {
        if (!newRow) return;

        if (!newRow.nome.trim()) {
            setError("O nome da turma é obrigatório (ex: A, B, C).");
            return;
        }

        setError("");
        setSaving(true);

        // Uppercase norm
        const formattedRow = {
            ...newRow,
            nome: newRow.nome.trim().toUpperCase()
        };

        const res = await addTurma(formattedRow);
        if (res.error) {
            setError(res.error);
            setSaving(false);
            return;
        }

        const { getTurmas } = await import("@/app/actions/turmas");
        const resData = await getTurmas();
        if (resData.data) {
            setTurmas(resData.data);
            setEditedTurmas(resData.data);
        }

        setIsAdding(false);
        setNewRow(null);
        setSaving(false);
    };

    const handleUpdateLocalField = (id: number, field: keyof Turma, value: string) => {
        const valToSave = field === "nome" ? value.toUpperCase() : value;
        const updatedList = editedTurmas.map(h => h.id === id ? { ...h, [field]: valToSave } : h);
        setEditedTurmas(updatedList);
        setError("");
    };

    const handleSaveEditRow = async (id: number) => {
        const turmaToSave = editedTurmas.find(t => t.id === id);
        if (!turmaToSave) return;

        if (!turmaToSave.nome.trim()) {
            setError("O nome da turma é obrigatório (ex: A, B, C).");
            return;
        }

        setError("");
        setSaving(true);
        const res = await updateTurma(id, { serie: turmaToSave.serie, nome: turmaToSave.nome });
        if (res.error) {
            setError(res.error);
            setSaving(false);
            return;
        }

        const { getTurmas } = await import("@/app/actions/turmas");
        const resData = await getTurmas();
        if (resData.data) {
            setTurmas(resData.data);
            setEditedTurmas(resData.data);
        }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja apagar esta turma?")) return;

        setError("");
        setSaving(true);
        const res = await deleteTurma(id);
        if (res.error) {
            setError(res.error);
            setSaving(false);
        } else {
            // Soft reload to keep edit state or hard reload
            window.location.reload();
        }
    };

    const activeList = isEditing ? editedTurmas : turmas;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    Estrutura de Turmas
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
                                <th className="px-4 py-3 font-medium">Série</th>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                {isEditing && <th className="px-4 py-3 font-medium text-right">Ação</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                            {activeList.length === 0 && !isAdding ? (
                                <tr>
                                    <td colSpan={isEditing ? 3 : 2} className="px-4 py-8 text-center text-slate-400">
                                        Nenhuma turma cadastrada.
                                    </td>
                                </tr>
                            ) : (
                                activeList.map((turma) => (
                                    <tr key={turma.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <select
                                                    value={turma.serie}
                                                    onChange={(e) => handleUpdateLocalField(turma.id, "serie", e.target.value as SerieTurma)}
                                                    className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="1º ANO">1º ANO</option>
                                                    <option value="2º ANO">2º ANO</option>
                                                    <option value="3º ANO">3º ANO</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${turma.serie === '1º ANO' ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' :
                                                    turma.serie === '2º ANO' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' :
                                                        'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                                                    }`}>
                                                    {turma.serie}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100 uppercase">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={turma.nome}
                                                    onChange={(e) => handleUpdateLocalField(turma.id, "nome", e.target.value)}
                                                    className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 max-w-[120px] uppercase"
                                                    placeholder="A"
                                                />
                                            ) : (
                                                turma.nome
                                            )}
                                        </td>
                                        {isEditing && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        onClick={() => handleDelete(turma.id)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                        disabled={saving || isAdding}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSaveEditRow(turma.id)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8"
                                                        disabled={saving}
                                                        title="Salvar alterações desta turma"
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
                            {isEditing && isAdding && newRow && (
                                <tr className="bg-indigo-50/50 dark:bg-indigo-500/5">
                                    <td className="px-4 py-3">
                                        <select
                                            value={newRow.serie}
                                            onChange={(e) => setNewRow({ ...newRow, serie: e.target.value as SerieTurma })}
                                            className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="1º ANO">1º ANO</option>
                                            <option value="2º ANO">2º ANO</option>
                                            <option value="3º ANO">3º ANO</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                                        <input
                                            type="text"
                                            value={newRow.nome}
                                            onChange={(e) => setNewRow({ ...newRow, nome: e.target.value })}
                                            className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 max-w-[120px] uppercase"
                                            placeholder="Ex: A"
                                            autoFocus
                                        />
                                    </td>

                                    <td className="px-4 py-3 text-right">
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
                            Adicionar Nova Turma
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
