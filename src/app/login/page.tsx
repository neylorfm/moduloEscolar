import { getInstituicao } from "@/app/actions/instituicao";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
    const { data: instituicao } = await getInstituicao();

    const schoolName = instituicao?.nome || "Escola Exemplo";
    const schoolLogo = instituicao?.logotipo_url;
    const primaryColor = instituicao?.cor_1 || "#4f46e5";
    const secondaryColor = instituicao?.cor_5 || "#f8fafc";

    return (
        <div className="min-h-screen w-full flex" style={{ backgroundColor: secondaryColor }}>
            {/* Left Panel - Branding */}
            <div
                className="hidden lg:flex w-1/2 flex-col justify-center items-center text-white relative overflow-hidden"
                style={{ backgroundColor: primaryColor }}
            >
                {/* Visual decoration */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(circle at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.4) 0%, transparent 20%)` }}>
                </div>

                <div className="z-10 text-center max-w-md px-8">
                    {schoolLogo ? (
                        <div className="w-40 h-40 bg-white rounded-2xl p-4 shadow-xl mb-8 mx-auto flex items-center justify-center transform transition-transform hover:scale-105">
                            <img src={schoolLogo} alt={schoolName} className="object-contain w-full h-full" />
                        </div>
                    ) : (
                        <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-2xl mb-8 mx-auto flex items-center justify-center border border-white/30 shadow-xl">
                            <span className="text-6xl font-bold">{schoolName.charAt(0)}</span>
                        </div>
                    )}

                    <h1 className="text-4xl font-bold tracking-tight mb-4">{schoolName}</h1>
                    <p className="text-lg opacity-90 font-medium">Benvindo ao sistema de gestão escolar.</p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white dark:bg-zinc-950">
                <div className="w-full max-w-sm space-y-8">
                    {/* Mobile Branding (only visible on small screens) */}
                    <div className="text-center lg:hidden mb-10">
                        {schoolLogo ? (
                            <img src={schoolLogo} alt={schoolName} className="h-20 object-contain mx-auto mb-4" />
                        ) : (
                            <div
                                className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white shadow-md"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {schoolName.charAt(0)}
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{schoolName}</h2>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mb-2">Acesso Restrito</h2>
                        <p className="text-slate-500 dark:text-zinc-400">Insira suas credenciais para continuar.</p>
                    </div>

                    <LoginForm primaryColor={primaryColor} />
                </div>
            </div>
        </div>
    );
}
