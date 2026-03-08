"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { importEnturmacoesCSV, CSVEnturmacaoRow } from "@/app/actions/enturmacoes";
import Papa from "papaparse";

export function CsvImportDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [results, setResults] = useState<{ success: boolean; imported?: number; totalRows?: number; errors?: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResults(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setResults(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as CSVEnturmacaoRow[];

                // Validação básica do cabeçalho
                if (rows.length > 0) {
                    const firstRow = rows[0];
                    const requiredKeys = ['turma_serie', 'turma_nome', 'disciplina', 'email_professor', 'dia_semana', 'aula'];
                    const hasAllKeys = requiredKeys.every(k => Object.keys(firstRow).includes(k));

                    if (!hasAllKeys) {
                        setResults({
                            success: false,
                            errors: [`O arquivo não possui as colunas obrigatórias. Esperado: ${requiredKeys.join(', ')}`]
                        });
                        setIsUploading(false);
                        return;
                    }
                }

                try {
                    const res = await importEnturmacoesCSV(rows);
                    setResults(res as any);
                    if (res.success && (!res.errors || res.errors.length === 0)) {
                        setTimeout(() => {
                            setIsOpen(false);
                            window.location.reload();
                            setFile(null);
                            setResults(null);
                        }, 2000);
                    }
                } catch (error: any) {
                    setResults({ success: false, errors: [error.message || "Erro desconhecido."] });
                } finally {
                    setIsUploading(false);
                }
            },
            error: (error) => {
                setResults({ success: false, errors: [`Erro ao ler arquivo: ${error.message}`] });
                setIsUploading(false);
            }
        });
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
                <UploadCloud className="h-4 w-4" /> Importar CSV
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Importar Enturmações</h2>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {!results ? (
                                <>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
                                        <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                        <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 mb-1">
                                            Selecione o arquivo CSV
                                        </p>
                                        <p className="text-xs text-slate-500 mb-4">
                                            Colunas obrigatórias na 1ª linha: <code>turma_serie, turma_nome, disciplina, email_professor, dia_semana, aula</code>
                                        </p>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-slate-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100
                                                cursor-pointer"
                                        />
                                    </div>

                                    {/* Preview Table */}
                                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                        <div className="bg-slate-50 dark:bg-zinc-800/50 px-3 py-2 border-b border-slate-200 dark:border-zinc-800">
                                            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Exemplo de preenchimento do arquivo:</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left text-slate-500 dark:text-zinc-400">
                                                <thead className="text-xs text-slate-700 dark:text-zinc-300 uppercase bg-slate-100/50 dark:bg-zinc-800/50">
                                                    <tr>
                                                        <th className="px-3 py-2 font-mono">turma_serie</th>
                                                        <th className="px-3 py-2 font-mono">turma_nome</th>
                                                        <th className="px-3 py-2 font-mono">disciplina</th>
                                                        <th className="px-3 py-2 font-mono">email_professor</th>
                                                        <th className="px-3 py-2 font-mono">dia_semana</th>
                                                        <th className="px-3 py-2 font-mono">aula</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b dark:border-zinc-800">
                                                        <td className="px-3 py-2">1º Ano</td>
                                                        <td className="px-3 py-2">Turma A</td>
                                                        <td className="px-3 py-2">Matemática</td>
                                                        <td className="px-3 py-2">joao.silva@escola.com</td>
                                                        <td className="px-3 py-2">Segunda</td>
                                                        <td className="px-3 py-2 font-medium text-indigo-600 dark:text-indigo-400">1</td>
                                                    </tr>
                                                    <tr className="border-b dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                                                        <td className="px-3 py-2">1º Ano</td>
                                                        <td className="px-3 py-2">Turma A</td>
                                                        <td className="px-3 py-2">Matemática</td>
                                                        <td className="px-3 py-2">joao.silva@escola.com</td>
                                                        <td className="px-3 py-2">Segunda</td>
                                                        <td className="px-3 py-2 font-medium text-indigo-600 dark:text-indigo-400">2</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-3 py-2">2º Ano</td>
                                                        <td className="px-3 py-2">Turma B</td>
                                                        <td className="px-3 py-2">História</td>
                                                        <td className="px-3 py-2">maria.souza@escola.com</td>
                                                        <td className="px-3 py-2">Terça</td>
                                                        <td className="px-3 py-2 font-medium text-indigo-600 dark:text-indigo-400">3</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-500 dark:text-zinc-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <strong>Dica:</strong> Para a coluna 'aula', informe apenas o número (1, 2, 3...) correspondente à ordem do horário cadastrado.
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {results.success ? (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Importação Concluída</h3>
                                            <p className="text-slate-500">
                                                {results.imported} horários de {results.totalRows} linhas foram salvos com sucesso.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Falha na Importação</h3>
                                            <p className="text-slate-500">Nenhum dado válido pôde ser importado.</p>
                                        </div>
                                    )}

                                    {results.errors && results.errors.length > 0 && (
                                        <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
                                            <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">Avisos e Erros</h4>
                                            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 max-h-40 overflow-y-auto">
                                                {results.errors.map((err, i) => (
                                                    <li key={i}>• {err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setIsOpen(false); setFile(null); setResults(null); }} disabled={isUploading}>
                                Cancelar
                            </Button>
                            {!results && (
                                <Button onClick={handleUpload} disabled={!file || isUploading} className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap">
                                    {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</> : "Começar Importação"}
                                </Button>
                            )}
                            {results && (
                                <Button onClick={() => { setIsOpen(false); window.location.reload(); setFile(null); setResults(null); }} className="bg-slate-900 hover:bg-slate-800">
                                    Fechar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
