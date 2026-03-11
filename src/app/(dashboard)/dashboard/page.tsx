import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Bem-vindo(a)</h3>
                        <LayoutDashboard className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">Sistema Gestão</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Navegue pelo menu lateral para acessar as funcionalidades.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
