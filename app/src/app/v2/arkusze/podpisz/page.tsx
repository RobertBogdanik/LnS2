"use client";

import SignSheet from "@/components/signSheet/signSheet";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInterface from "@/config/axios";
import { useSignSheetStore } from "@/context/sign";
import { useUserStore } from "@/context/user";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const SignPage = () => {
    type Sheet = {
        id: string;
        name: string;
        closed_at: string;
        author: string;
    };
    const [sheets, setSheets] = useState<Sheet[]>([]);
    const [loading, setLoading] = useState(true);
    const { openSignSheetStoreModal} = useSignSheetStore();

    const {
        isAdmin
    } = useUserStore();

    const loadData = async () => {
        setLoading(true);

        const res = await axiosInterface.get('/sheet/toSign');
        setSheets(res.data);
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);
    
    const signAll = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            await axiosInterface.post('/sheet/signAll');
            loadData();
            toast.success("Wszystkie arkusze zostały podpisane");
        } catch (error) {
            toast.error("Wystąpił błąd podczas podpisywania arkuszy");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-4 container mx-auto">
            <SignSheet onClose={loadData} />
            {isAdmin && <Button className="mb-4 w-full" onClick={signAll}>Podpisz wszystkie</Button>}
            <h1 className="text-2xl font-bold mb-4">Arkusze do podpisania</h1>
            {loading ? (
                <p>Ładowanie...</p>
            ) : sheets.length === 0 ? (
                <p>Brak arkuszy do podpisania.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Autor</TableHead>
                            <TableHead>Oczekuje od</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sheets.map((sheet) => (
                            <TableRow key={sheet.id}>
                                <TableCell>{sheet.name}</TableCell>
                                <TableCell>{sheet.author}</TableCell>
                                <TableCell>{new Date(sheet.closed_at).toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button onClick={() => openSignSheetStoreModal(sheet.id)}>Podpisz</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    )
}

export default SignPage;