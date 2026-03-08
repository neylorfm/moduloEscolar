"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";

type UserProfile = {
    id: string;
    nome: string;
    email: string;
    tipo: "professor" | "coordenador" | "administrador";
    avatar_url: string | null;
    alias: string | null;
};

type AuthContextType = {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function fetchProfile(userId: string) {
            const { data, error } = await supabase
                .from("usuarios")
                .select("*")
                .eq("id", userId)
                .single();

            if (mounted) {
                if (data) setProfile(data as UserProfile);
                else setProfile(null);
            }
        }

        async function initAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                setUser(session?.user || null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (mounted) {
                    setUser(session?.user || null);
                    if (session?.user) {
                        await fetchProfile(session.user.id);
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        // Redirect to login handled by protected layouts or components if needed
        window.location.href = "/login";
    };

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let activityListener: () => void;

        if (profile) {
            async function setupTimeout() {
                // Fetch settings directly from DB or via action
                const { data, error } = await supabase
                    .from("instituicao")
                    .select("logout_professor, logout_coordenador, logout_administrador")
                    .eq("id", 1)
                    .single();

                if (data && profile) {
                    let maxMinutes = 60;
                    if (profile.tipo === "professor") maxMinutes = data.logout_professor;
                    else if (profile.tipo === "coordenador") maxMinutes = data.logout_coordenador;
                    else if (profile.tipo === "administrador") maxMinutes = data.logout_administrador;

                    const maxMs = maxMinutes * 60 * 1000;

                    const resetTimer = () => {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => {
                            console.log(`Sessão expirada após ${maxMinutes} minutos de inatividade.`);
                            signOut();
                        }, maxMs);
                    };

                    // Throttle listener to avoid too many state updates/calls
                    let ticking = false;
                    activityListener = () => {
                        if (!ticking) {
                            window.requestAnimationFrame(() => {
                                resetTimer();
                                ticking = false;
                            });
                            ticking = true;
                        }
                    };

                    window.addEventListener("mousemove", activityListener);
                    window.addEventListener("keydown", activityListener);
                    window.addEventListener("click", activityListener);
                    window.addEventListener("scroll", activityListener);

                    resetTimer(); // Start initial timer
                }
            }
            setupTimeout();
        }

        return () => {
            clearTimeout(timeoutId);
            if (activityListener) {
                window.removeEventListener("mousemove", activityListener);
                window.removeEventListener("keydown", activityListener);
                window.removeEventListener("click", activityListener);
                window.removeEventListener("scroll", activityListener);
            }
        };
    }, [profile]);

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
