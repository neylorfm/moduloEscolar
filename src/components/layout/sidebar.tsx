"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getInstituicao } from "@/app/actions/instituicao"
import { useAuth } from "@/components/auth/auth-provider"
import { ProfileDialog } from "@/components/users/profile-dialog"
import {
    Calendar,
    Settings,
    ChevronLeft,
    ChevronRight,
    Power,
    LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Agendamentos",
        icon: Calendar,
        href: "/agendamentos", // Assuming separate route or could be same as dashboard
        color: "text-violet-500",
    },
    {
        label: "Configurações",
        icon: Settings,
        href: "/settings",
        adminOnly: true,
    },
]

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const pathname = usePathname()
    const { profile, signOut } = useAuth()
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [isProfileOpen, setIsProfileOpen] = React.useState(false)
    const [instituicao, setInstituicao] = React.useState<any>(null)

    React.useEffect(() => {
        async function fetchConfig() {
            const res = await getInstituicao()
            if (res.data) setInstituicao(res.data)
        }
        fetchConfig()
    }, [])

    const schoolName = instituicao?.nome || "Escola Exemplo"
    const schoolLogo = instituicao?.logotipo_url || null
    const primaryColor = instituicao?.cor_1 || "#4f46e5"

    return (
        <div
            className={cn(
                "relative flex h-screen flex-col bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out hidden md:flex",
                isCollapsed ? "w-20" : "w-64",
                className
            )}
        >
            {/* Header / Logo */}
            <div className={cn("flex items-center border-b border-slate-800 px-4 py-4", isCollapsed ? "h-16" : "min-h-[64px] py-6")}>
                <Link href="/dashboard" className={cn("flex w-full", isCollapsed ? "items-center justify-center" : "flex-col items-start gap-3")}>
                    {schoolLogo ? (
                        <div className={cn("relative flex items-center justify-center bg-white rounded-lg p-0.5 shrink-0", isCollapsed ? "h-8 w-8" : "h-10 w-10")}>
                            <img src={schoolLogo} alt={schoolName} className="object-contain w-full h-full rounded-md" />
                        </div>
                    ) : (
                        <div
                            className={cn("relative flex shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-sm", isCollapsed ? "h-8 w-8 text-sm" : "h-10 w-10 text-lg")}
                            style={{ backgroundColor: primaryColor }}
                        >
                            {schoolName.charAt(0)}
                        </div>
                    )}

                    {!isCollapsed && (
                        <h1 className="text-base font-bold tracking-tight text-white transition-all duration-300 whitespace-normal break-words leading-tight w-full pr-2">
                            {schoolName}
                        </h1>
                    )}
                </Link>
            </div>

            {/* Toggle Button */}
            <div className="absolute right-[-12px] top-20 z-10">
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 rounded-full shadow-md border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                    ) : (
                        <ChevronLeft className="h-3 w-3" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 w-full">
                <nav className="grid gap-2 px-2">
                    <TooltipProvider delayDuration={0}>
                        {routes.filter(route => !route.adminOnly || profile?.tipo === "administrador").map((route) => (
                            isCollapsed ? (
                                <Tooltip key={route.href}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={route.href}
                                            className={cn(
                                                "group flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors md:h-8 md:w-8 mx-auto",
                                                pathname.startsWith(route.href) && "bg-slate-800 text-white shadow-inner"
                                            )}
                                        >
                                            <route.icon className={cn("h-5 w-5", route.color)} />
                                            <span className="sr-only">{route.label}</span>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-slate-900 text-slate-100 text-xs border-slate-800">
                                        {route.label}
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800/50 hover:text-white transition-all w-full",
                                        pathname.startsWith(route.href) ? "bg-slate-800 text-white shadow-inner" : "text-slate-400"
                                    )}
                                >
                                    <route.icon className={cn("h-5 w-5", route.color)} />
                                    <span className="truncate w-full">{route.label}</span>
                                </Link>
                            )
                        ))}
                    </TooltipProvider>
                </nav>
            </div>

            {/* Footer / User Profile */}
            <div className="border-t border-slate-800 p-4 pb-20 w-full">
                <div className={cn("flex flex-col gap-4", isCollapsed ? "items-center" : "")}>
                    <button
                        onClick={() => setIsProfileOpen(true)}
                        className={cn(
                            "flex items-center gap-3 overflow-hidden w-full text-left hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors cursor-pointer",
                            isCollapsed ? "justify-center" : ""
                        )}
                    >
                        <Avatar className="h-9 w-9 border border-slate-700 shrink-0">
                            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.nome} />
                            <AvatarFallback className="bg-slate-800 text-slate-300">
                                {profile?.nome ? profile.nome.charAt(0).toUpperCase() : "?"}
                            </AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="flex flex-col w-full overflow-hidden">
                                <span className="truncate text-sm font-medium text-white w-full">
                                    {profile?.nome || "Carregando..."}
                                </span>
                                <span className="truncate text-xs text-slate-400 w-full">
                                    {profile?.alias || profile?.email}
                                </span>
                            </div>
                        )}
                    </button>

                    {isCollapsed ? (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => signOut()} className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg shrink-0">
                                        <Power className="h-5 w-5" />
                                        <span className="sr-only">Sair</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-slate-900 text-slate-100 text-xs border-slate-800">
                                    Sair
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={() => signOut()}
                            className="w-full justify-start gap-2 border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <Power className="h-4 w-4 shrink-0" />
                            <span className="truncate">Sair</span>
                        </Button>
                    )}
                </div>
            </div>

            <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
    )
}
