"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

export function LoginForm({ primaryColor }: { primaryColor: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message.includes("Invalid login credentials")) {
                    throw new Error("Email ou senha inválidos.");
                }
                throw authError;
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Erro ao fazer login.");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-5">
            {error && (
                <div className="p-3 text-sm bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Email</label>
                <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-shadow bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    placeholder="voce@exemplo.com"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Senha</label>
                    <span className="text-xs text-slate-500">Esqueceu a senha? Fale com a coordenação.</span>
                </div>
                <input
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-shadow bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    placeholder="••••••••"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-base font-semibold text-white transition-all shadow-md hover:shadow-lg mt-4"
                style={{ backgroundColor: primaryColor }}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : "Entrar no Sistema"}
            </Button>

            <p className="text-center text-sm text-slate-500 mt-8">
                Problemas no acesso? Procure a coordenação.
            </p>
        </form>
    );
}
