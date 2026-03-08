"use client";

import { useState } from "react";
import { Horario, addHorario, updateHorario, deleteHorario, TipoHorario } from "@/app/actions/horarios";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Check, X, Trash2, Save } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export function HorariosClient({ initialHorarios }: { initialHorarios: Horario[] }) {
    const { profile } = useAuth();
    const isAdmin = profile?.tipo === "administrador";

    const [horarios, setHorarios] = useState<Horario[]>(initialHorarios);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // State for explicitly adding a new row
    const [isAdding, setIsAdding] = useState(false);
    const [newRow, setNewRow] = useState<Omit<Horario, 'id'> | null>(null);

    // Temporary state for the edit mode
    const [editedHorarios, setEditedHorarios] = useState<Horario[]>(initialHorarios);

    const formatTime = (time: string) => time.substring(0, 5); // "07:30:00" -> "07:30"

    const calculateSequence = (list: Horario[]) => {
        let aulaCount = 1;
        return list.map(h => {
            if (h.tipo === "Aula") {
                return `${aulaCount++}ª Aula`;
            }
            return h.tipo;
        });
    };

    const handleEditStart = () => {
        setEditedHorarios([...horarios]);
        setIsEditing(true);
        setIsAdding(false);
        setError("");
    };

    const handleCancel = () => {
        setEditedHorarios([...horarios]);
        setIsEditing(false);
        setIsAdding(false);
        setNewRow(null);
        setError("");
    };

    const handleStartAdd = () => {
        setError("");

        let newInicio = "07:00";
        if (editedHorarios.length > 0) {
            newInicio = formatTime(editedHorarios[editedHorarios.length - 1].fim);
        }

        const [hours, mins] = newInicio.split(":").map(Number);
        const date = new Date(2000, 0, 1, hours, mins);
        date.setMinutes(date.getMinutes() + 50);
        const newFim = date.toTimeString().substring(0, 5);

        setNewRow({
            inicio: newInicio + ":00",
            fim: newFim + ":00",
            tipo: "Aula"
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
        setError("");

        // Validate sequence
        if (editedHorarios.length > 0) {
            const prevFim = editedHorarios[editedHorarios.length - 1].fim;
            if (newRow.inicio < prevFim) {
                setError(`O início não pode ser menor que o término do horário anterior (${formatTime(prevFim)})`);
                return;
            }
        }

        if (newRow.inicio >= newRow.fim) {
            setError("O horário de término deve ser maior que o horário de início.");
            return;
        }

        setSaving(true);
        const res = await addHorario(newRow);
        if (res.error) {
            setError(res.error);
            setSaving(false);
            return;
        }

        // Add to local state rather than reloading
        // getHorarios will refetch behind the scenes on next load, 
        // but for now we update our local arrays to stay in edit mode
        const { getHorarios } = await import("@/app/actions/horarios");
        const resData = await getHorarios();
        if (resData.data) {
            setHorarios(resData.data);
            setEditedHorarios(resData.data);
        }

        setIsAdding(false);
        setNewRow(null);
        setSaving(false);
    };

    const handleUpdateField = async (id: number, field: keyof Horario, value: string) => {
        // Optimistic UI Update
        const updatedList = editedHorarios.map(h => h.id === id ? { ...h, [field]: value } : h);

        // Validate sequential logic before saving
        const currentIndex = updatedList.findIndex(h => h.id === id);
        if (currentIndex > 0 && field === "inicio") {
            const prevFim = updatedList[currentIndex - 1].fim;
            if (value < prevFim) {
                setError(`O início não pode ser menor que o término do horário anterior (${formatTime(prevFim)})`);
                return;
            }
        }

        setEditedHorarios(updatedList);
        setError("");

        // Call server
        setSaving(true);
        const res = await updateHorario(id, { [field]: value });
        if (res.error) {
            setError(res.error);
            // Revert on error
            setEditedHorarios([...horarios]);
        } else {
            setHorarios(updatedList);
        }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja apagar este horário?")) return;

        setError("");
        setSaving(true);
        const res = await deleteHorario(id);
        if (res.error) {
            setError(res.error);
            setSaving(false);
        } else {
            window.location.reload();
        }
    };

    // calculate labels for the list including the temporary new row if it exists
    const fullActiveList = isAdding && newRow ? [...(isEditing ? editedHorarios : horarios), { ...newRow, id: 999999 }] : (isEditing ? editedHorarios : horarios);
    const labels = calculateSequence(fullActiveList);
    const activeList = isEditing ? editedHorarios : horarios;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    Estrutura de Turnos
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
                                <th className="px-4 py-3 font-medium">#</th>
                                <th className="px-4 py-3 font-medium">Início</th>
                                <th className="px-4 py-3 font-medium">Término</th>
                                <th className="px-4 py-3 font-medium">Tipo</th>
                                {isEditing && <th className="px-4 py-3 font-medium text-right">Ação</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                            {activeList.length === 0 && !isAdding ? (
                                <tr>
                                    <td colSpan={isEditing ? 5 : 4} className="px-4 py-8 text-center text-slate-400">
                                        Nenhum horário cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                activeList.map((horario, index) => (
                                    <tr key={horario.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                                            {labels[index]}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input
                                                    type="time"
                                                    value={formatTime(horario.inicio)}
                                                    onChange={(e) => handleUpdateField(horario.id, "inicio", e.target.value + ":00")}
                                                    className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 max-w-[120px]"
                                                />
                                            ) : (
                                                formatTime(horario.inicio)
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input
                                                    type="time"
                                                    value={formatTime(horario.fim)}
                                                    onChange={(e) => handleUpdateField(horario.id, "fim", e.target.value + ":00")}
                                                    className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 max-w-[120px]"
                                                />
                                            ) : (
                                                formatTime(horario.fim)
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <select
                                                    value={horario.tipo}
                                                    onChange={(e) => handleUpdateField(horario.id, "tipo", e.target.value as TipoHorario)}
                                                    className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="Aula">Aula</option>
                                                    <option value="Intervalo">Intervalo</option>
                                                    <option value="Almoço">Almoço</option>
                                                    <option value="Janta">Janta</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${horario.tipo === 'Aula' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' :
                                                    horario.tipo === 'Intervalo' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                    }`}>
                                                    {horario.tipo}
                                                </span>
                                            )}
                                        </td>
                                        {isEditing && (
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    onClick={() => handleDelete(horario.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                    disabled={saving || isAdding}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}

                            {/* New Row Form */}
                            {isEditing && isAdding && newRow && (
                                <tr className="bg-indigo-50/50 dark:bg-indigo-500/5">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                                        {labels[labels.length - 1]} <span className="text-xs text-indigo-500 ml-1">(Novo)</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="time"
                                            value={formatTime(newRow.inicio)}
                                            onChange={(e) => setNewRow({ ...newRow, inicio: e.target.value + ":00" })}
                                            className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 max-w-[120px]"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="time"
                                            value={formatTime(newRow.fim)}
                                            onChange={(e) => setNewRow({ ...newRow, fim: e.target.value + ":00" })}
                                            className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 max-w-[120px]"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={newRow.tipo}
                                            onChange={(e) => setNewRow({ ...newRow, tipo: e.target.value as TipoHorario })}
                                            className="px-2 py-1 border rounded bg-white dark:bg-zinc-950 dark:border-zinc-800 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="Aula">Aula</option>
                                            <option value="Intervalo">Intervalo</option>
                                            <option value="Almoço">Almoço</option>
                                            <option value="Janta">Janta</option>
                                        </select>
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
                            Adicionar Novo Horário
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
