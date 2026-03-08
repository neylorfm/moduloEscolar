"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Power } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { routes } from "@/components/layout/sidebar"
import { getInstituicao } from "@/app/actions/instituicao"
import { useAuth } from "@/components/auth/auth-provider"
import { ProfileDialog } from "@/components/users/profile-dialog"

export function MobileSidebar() {
    const pathname = usePathname()
    const { profile, signOut } = useAuth()
    const [open, setOpen] = React.useState(false)
    const [isProfileOpen, setIsProfileOpen] = React.useState(false)
    const [instituicao, setInstituicao] = React.useState<any>(null)

    React.useEffect(() => {
        async function fetchConfig() {
            const res = await getInstituicao()
            if (res.data) setInstituicao(res.data)
        }
        fetchConfig()
    }, [])

    // Close sheet when navigating
    React.useEffect(() => {
        setOpen(false)
    }, [pathname])

    const schoolName = instituicao?.nome || "Escola Exemplo"
    const schoolLogo = instituicao?.logotipo_url || null
    const primaryColor = instituicao?.cor_1 || "#4f46e5"

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden text-slate-500 hover:bg-slate-100">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Abrir menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-slate-900 p-0 text-slate-100 border-r-slate-800">
                    <SheetHeader className="px-6 py-6 border-b border-slate-800 text-left">
                        <SheetTitle className="text-white flex flex-col items-start gap-3">
                            {schoolLogo ? (
                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center bg-white rounded-lg p-0.5">
                                    <img src={schoolLogo} alt={schoolName} className="object-contain w-full h-full rounded-md" />
                                </div>
                            ) : (
                                <div
                                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-white text-lg shadow-sm"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {schoolName.charAt(0)}
                                </div>
                            )}
                            <span className="text-base font-bold tracking-tight whitespace-normal break-words leading-tight w-full">
                                {schoolName}
                            </span>
                        </SheetTitle>
                        <SheetDescription className="sr-only">
                            Menu de navegação mobile
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto py-4 px-3">
                            <nav className="grid gap-2">
                                {routes.filter(route => !route.adminOnly || profile?.tipo === "administrador").map((route) => (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-800/50 hover:text-white transition-all",
                                            pathname.startsWith(route.href) ? "bg-slate-800 text-white" : "text-slate-400"
                                        )}
                                    >
                                        <route.icon className={cn("h-5 w-5", route.color)} />
                                        {route.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <div className="p-4 border-t border-slate-800 mt-auto mb-10">
                            <button
                                onClick={() => setIsProfileOpen(true)}
                                className="flex items-center gap-3 mb-4 w-full text-left hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <Avatar className="h-10 w-10 border border-slate-700">
                                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.nome} />
                                    <AvatarFallback className="bg-slate-800 text-slate-300">
                                        {profile?.nome ? profile.nome.charAt(0).toUpperCase() : "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col overflow-hidden w-full">
                                    <span className="truncate text-sm font-medium text-white">
                                        {profile?.nome || "Carregando..."}
                                    </span>
                                    <span className="truncate text-xs text-slate-400">
                                        {profile?.alias || profile?.email}
                                    </span>
                                </div>
                            </button>

                            <Button
                                variant="ghost"
                                onClick={signOut}
                                className="w-full justify-start gap-2 border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                                <Power className="h-4 w-4" />
                                Sair
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </>
    )
}
