"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import axiosInterface from "@/config/axios";
import { DialogTitle } from "@radix-ui/react-dialog";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ArkuszPage = () => {
    const [data, setData] = useState<{
        positions: string[]
        basicPath: string
    }>({ positions: [], basicPath: '' });
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        axiosInterface.get('/export').then(res => {
            setData(res.data);
        });
    }, []);

    const eksportData = async () => {
        setIsExporting(true);
        try {
            const newRes = await axiosInterface.get('/export/exportPart');
            downloadFile(newRes.data);
            const res = await axiosInterface.get('/export');
            setData(res.data);
        } catch (error) {
            console.error("Błąd podczas eksportu danych:", error);
        } finally {
            setIsExporting(false);
        }
    }

    const downloadFile = (fileName: string) => {
        try {
            const fileUrl = `http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=${data.basicPath}/${fileName}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = `${fileName}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Plik został pobrany.');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                toast.error("Nie można pobrać eksportu.", {
                    description: error.response?.data?.message || "Wystąpił błąd podczas pobierania eksportu."
                });
                return;
            }
            return;
        }
    }

    return (
        <>
            <Dialog open={isExporting} onOpenChange={() => setIsExporting(false)}>
                <DialogContent className="sm:max-w-5xl">
                    <DialogTitle>Eksportowanie danych</DialogTitle>
                    <div className="flex justify-center mt-3 h-5 space-x-2">
                        <div className="w-3 h-5 rounded-full bg-primary animate-bounce"></div>
                        <div className="w-3 h-5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-3 h-5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="p-6 container mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold mb-4">Eksporty</h2>
                    <Button variant={'outline'} onClick={eksportData}>Eksportuj</Button>
                </div>
                {data.positions.length === 0 ? (
                    <p>Brak danych do wyświetlenia.</p>
                ) : (
                    <ul>
                        {data.positions.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center py-2 border-b hover:bg-gray-100">
                                <span>{item}</span>
                                <Button onClick={() => downloadFile(item)}>Pobierz</Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    )
}

export default ArkuszPage