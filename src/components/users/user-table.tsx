"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserDialog } from "./user-dialog";
import { Badge } from "@/components/ui/badge"; // Let's use a badge if available or simple spans

export function UserTable({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</div>;
    }

    const roleColors: Record<string, string> = {
        administrador: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        coordenador: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        professor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 dark:bg-zinc-900/50 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                        <th className="px-6 py-4 font-medium">Usuário</th>
                        <th className="px-6 py-4 font-medium">Email</th>
                        <th className="px-6 py-4 font-medium">Como deseja ser chamado</th>
                        <th className="px-6 py-4 font-medium">Papel</th>
                        <th className="px-6 py-4 font-medium text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                    {data.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-slate-200 dark:border-zinc-700">
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                            {user.nome.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-slate-900 dark:text-zinc-100">{user.nome}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-zinc-400">{user.email}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-zinc-400">{user.alias || '—'}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.tipo] || 'bg-slate-100 text-slate-800'}`}>
                                    {(user.tipo as string).charAt(0).toUpperCase() + (user.tipo as string).slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <UserDialog mode="edit" userData={user} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
