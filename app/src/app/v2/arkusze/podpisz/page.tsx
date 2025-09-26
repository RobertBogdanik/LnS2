"use client";

import SignSheet from "@/components/signSheet/signSheet";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInterface from "@/config/axios";
import { useSignSheetStore } from "@/context/sign";
import { useEffect, useState } from "react";

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

    const loadData = async () => {
        setLoading(true);

        const res = await axiosInterface.get('/sheet/toSign');
        setSheets(res.data);
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="p-4 container mx-auto">
            <SignSheet />
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
                                    <Button variant="outline" onClick={() => openSignSheetStoreModal(sheet.id)}>Podpisz</Button>
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