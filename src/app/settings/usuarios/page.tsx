import { supabaseAdmin } from "@/lib/supabase-admin";
import { UserTable } from "@/components/users/user-table";
import { UserDialog } from "@/components/users/user-dialog";

export default async function UsuariosPage() {
    // Busca os usuários no banco
    const { data: usuarios, error } = await supabaseAdmin
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-4 text-red-500">Erro ao carregar usuários: {error.message}</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-zinc-100">Gerenciamento de Usuários</h2>
                    <p className="text-sm text-slate-500 mt-1 dark:text-zinc-400">
                        Adicione, edite ou remova acessos ao sistema.
                    </p>
                </div>
                <UserDialog mode="create" />
            </div>

            <div className="p-0">
                <UserTable data={usuarios || []} />
            </div>
        </div>
    );
}
