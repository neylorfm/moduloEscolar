import { getRecursos } from "@/app/actions/recursos";
import { RecursosClient } from "@/components/settings/recursos/recursos-client";

export const metadata = {
    title: "Recursos - Módulo Escolar",
    description: "Gerenciamento de espaços físicos e recursos da escola",
};

export default async function RecursosPage() {
    const recursosRes = await getRecursos();
    const recursos = recursosRes.data || [];

    return (
        <RecursosClient
            initialRecursos={recursos}
        />
    );
}
