"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { Loader2 } from "lucide-react";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { profile, loading } = useAuth();
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (!loading) {
            if (profile?.tipo !== "administrador") {
                router.push("/dashboard");
            } else {
                setAuthorized(true);
            }
        }
    }, [profile, loading, router]);

    if (loading || !authorized) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const tabs = [
        { name: 'Usuários', href: '/settings/usuarios' },
        { name: 'Instituição', href: '/settings/instituicao' },
        { name: 'Turmas', href: '/settings/turmas' },
        { name: 'Enturmação', href: '/settings/enturmacao' },
        { name: 'Horários', href: '/settings/horarios' },
        { name: 'Áreas', href: '/settings/areas' },
        { name: 'Recursos', href: '/settings/recursos' },
    ];

    return (
        <div className="mx-auto max-w-5xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Configurações</h1>

            <div className="border-b border-slate-200 mb-8">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = pathname.startsWith(tab.href);
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={cn(
                                    isActive
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {children}
        </div>
    );
}
