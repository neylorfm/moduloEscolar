"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();

    const isPublicPage = pathname === "/login";

    useEffect(() => {
        if (!loading) {
            if (!user && !isPublicPage) {
                router.push("/login");
            } else if (user && isPublicPage) {
                router.push("/dashboard");
            }
        }
    }, [user, loading, isPublicPage, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (isPublicPage) {
        return <main className="flex-1 w-full h-screen relative bg-slate-50">{children}</main>;
    }

    if (!user && !isPublicPage) return null; // Prevent flicker before redirect

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex h-16 items-center border-b border-slate-200 bg-white px-4 md:hidden justify-between">
                    <MobileSidebar />
                    <div className="font-semibold text-slate-900">
                        Menu
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
    );
}
