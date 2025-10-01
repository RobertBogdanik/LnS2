'use client'

import React from "react";
import Papa from 'papaparse';
import axiosInterface from "@/config/axios";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ImportPage = () => {
    type FileType = {
        name: string;
        letter: string;
        origin: string;
        parsed: Record<string, string>[];
        sheets: SheetType[];
    };

    const [files, setFiles] = React.useState<FileType[]>([]);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    type SheetType = {
        name: string;
        baseOnPaper: boolean;
        sheetLetter: string;
        positions: number;
    }

    const openCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []) as File[];
        const newFiles = await Promise.all(selectedFiles.map(async (file: File) => {
            const text = await file.text();
            const fileContent = `nazwa,EAN,ilosc,cena,arkusz\n${text}`;

            const json = Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true
            }).data as Record<string, string>[];

            const fileName = file.name;
            const letter = fileName.split("-")[0];

            const uniqueSheetsInfo = Array.from(
                new Set(json.map((row) => row.arkusz).filter(Boolean))
            ).map(sheetName => {
                const positionsCount = json.filter((row) => row.arkusz === sheetName).length;
                return {
                    name: sheetName as string,
                    baseOnPaper: /^[A-Za-z]/.test(sheetName as string),
                    sheetLetter: (sheetName as string).split("-")[0].match(/[a-zA-Z]/g)?.[0] || '-',
                    positions: positionsCount
                };
            });

            return {
                name: fileName,
                letter: letter,
                origin: text,
                parsed: json,
                sheets: uniqueSheetsInfo
            };
        }));

        setFiles(files => [...files, ...newFiles]);
        e.target.value = "";
    }

    const sheetSumUp = () => {
        setIsLoading(true);
        if (files.length === 0) {
            toast.error('Brak plików do zaimportowania');
            setIsLoading(false);
            return;
        }
        axiosInterface.post('/import', files)
            .then(response => {
                setIsLoading(false);
                toast.success('Import zakończony pomyślnie', {
                    description: response.data.message
                });
            })
            .catch(error => {
                setIsLoading(false);
                toast.error('Błąd podczas importu', {
                    description: error.response?.data?.message || error.message,
                });
            });
    }

    return (<>

        <AlertDialog open={isLoading} onOpenChange={setIsLoading}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Importowanie danych</AlertDialogTitle>
                    <div className="flex justify-center mt-3 h-5 space-x-2">
                        <div className="w-3 h-5 rounded-full bg-primary animate-bounce"></div>
                        <div className="w-3 h-5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-3 h-5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                </AlertDialogHeader>
            </AlertDialogContent>
        </AlertDialog>
        <main className="flex-1 p-6 bg-white">
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-full container space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        <button className="bg-black text-white py-2 px-4 rounded-lg col-span-4" onClick={sheetSumUp}>
                            Zapisz
                        </button>
                        <div
                            className="flex col-span-4 flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-black p-6 cursor-pointer hover:border-gray-800 transition"
                        >
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                multiple={true}
                                accept=".txt"
                                onChange={openCsv}
                            />
                            <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                                <span className="font-medium text-black">Wybierz pliki</span>
                                <span className="text-xs text-gray-600 mt-1">Akceptowane formaty: *.piku</span>
                            </label>
                        </div>
                        {files.map((file, idx) => <div
                            key={idx}
                            className={`flex items-center rounded-lg shadow p-4 space-x-4 border cursor-pointer transition bg-white border-black`}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <div className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl font-bold border bg-black text-white border-black`}>
                                    {file.letter}
                                </div>
                            </div>
                            <div>
                                <div className={`font-semibold text-black`}>{file.name}</div>
                                <div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {file.sheets.map((sheet: SheetType, sidx: number) => (
                                            <span
                                                key={sidx}
                                                className={`px-2 py-1 rounded-full text-xs 
                                                            ${sheet.baseOnPaper ? "bg-gray-200 text-gray-800" : "bg-green-500 text-white"}
                                                            ${sheet.sheetLetter !== file.letter ? "bg-red-500 text-white" : ""}
                                                        `}
                                            >
                                                <strong>{sheet.name} {sheet.baseOnPaper ? "(papier)" : "(dynamika)"}</strong> - {sheet.positions}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>)}
                    </div>
                </div>
            </div>
        </main>
    </>
    );
};

export default ImportPage;