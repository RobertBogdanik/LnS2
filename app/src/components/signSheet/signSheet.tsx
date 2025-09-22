import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCallback, useEffect, useState } from "react";
import axiosInterface from "@/config/axios";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSignSheetStore } from "@/context/sign";
import { toast } from "sonner";
import axios from "axios";

interface SheetPosition {
  id: number;
  TowId: number;
  ItemName: string;
  MainCode: string;
  ExtraCodes: string;
  counted: number;
  expected: number;
  delta: number;
  deltaValue: number;
  onPcMarket: number;
  onShelf: number;
  newDelta: number;
  RetailPrice: number;
}

interface SignSheetRequest {
  id: number;
  TowId: number;
  onPcMarket: number;
  onShelf: number;
}

const SignSheet = () => {
    const { isSignSheetStoreOpen, sheetId, closeSignSheetStoreModal } = useSignSheetStore();
    const [sheetData, setSheetData] = useState<SheetPosition[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadSheet = useCallback(async (id: number) => {
        if (!id) return;

        setIsLoading(true);
        const res = await axiosInterface.get(`sheet/toSign/${id}`);
        setSheetData(res.data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (sheetId) {
            loadSheet(Number(sheetId));
        }
    }, [sheetId, loadSheet]);

    const signSheet = useCallback(async () => {
        if (!sheetId || !sheetData) return;

        const changedRows: SignSheetRequest[] = sheetData
            .filter((pos) => Number(pos.newDelta) !== Number(pos.delta))
            .map((pos) => ({
                id: pos.id,
                TowId: pos.TowId,
                onPcMarket: pos.onPcMarket,
                onShelf: pos.onShelf
            }));
        try {
            await axiosInterface.put(`sheet/${sheetId}/sign`, { positions: changedRows });
            toast.success("Arkusz podpisany pomyślnie.");
            closeSignSheetStoreModal();
            setSheetData(null);
        } catch (error) {
            if(axios.isAxiosError(error) && error.response?.status === 400) {
                toast.error("Nie można podpisać arkusza.", {
                    description: error.response?.data?.message || "Wystąpił błąd podczas podpisywania arkusza."
                });
                return;
            }
            return;
        }

    }, [sheetId, sheetData, closeSignSheetStoreModal]);

    if (!sheetId) return null;

    return (
        <Dialog open={isSignSheetStoreOpen} onOpenChange={closeSignSheetStoreModal}>

            {/* <DialogContent className="min-w-7xl h-[90vh] flex flex-col gap-0 p-0" showCloseButton={false}> */}
            <DialogContent className="sm:max-w-[1400px] max-h-[700px] flex flex-col">
                <DialogHeader className="gap-0 p-2">
                    <DialogTitle className="text-2xl font-bold mb-2">Podpisz arkusz {sheetId}</DialogTitle>
                </DialogHeader>
                {!isLoading && <>
                    {/* <div className="overflow-y-auto max-h-full"> */}
                    <Table className="overflow-y-auto">
                        <TableHeader className="sticky top-0 z-40 bg-gray-200">
                            <TableRow className="bg-gray-200 m-0 border-none">
                                <TableHead colSpan={2} className="text-center">Produkt</TableHead>
                                <TableHead colSpan={4} className="border-l border-r border-black text-center">Import</TableHead>
                                <TableHead colSpan={4} className="text-center">Stan aktualny</TableHead>
                            </TableRow>
                            <TableRow className="bg-gray-200 !h-0 m-0 border-none">
                                <TableHead className="text-center">Nazwa</TableHead>
                                <TableHead className="text-center">Kod</TableHead>
                                <TableHead className="text-center border-l border-black">Import</TableHead>
                                <TableHead className="text-center">Oczek.</TableHead>
                                <TableHead className="text-center">Delta</TableHead>
                                <TableHead className="text-center">Wartość</TableHead>
                                <TableHead className="text-center border-l border-black">Półka</TableHead>
                                <TableHead className="text-center">PcM</TableHead>
                                <TableHead className="text-center">Delta</TableHead>
                                <TableHead className="text-center">Wartość</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sheetData?.map((position) => (
                                <TableRow key={position.id} className="hover:bg-gray-200">
                                    <TableCell>{position.ItemName}</TableCell>
                                    <TableCell>
                                        <strong>{position.MainCode.replaceAll('?', '')}</strong>
                                        {position.ExtraCodes
                                            .split(';')
                                            .filter((code: string) => code.trim() !== '')
                                            .map((code: string, idx: number) => (
                                                <div key={idx}>{code.replaceAll('?', '')}</div>
                                            ))}
                                    </TableCell>
                                    <TableCell className="border-l border-black">{position.counted}</TableCell>
                                    <TableCell>{position.expected}</TableCell>
                                    <TableCell
                                        className={
                                            Number(position.delta) > 0
                                                ? "text-green-600 font-bold"
                                                : Number(position.delta) < 0
                                                    ? "text-red-600 font-bold"
                                                    : ""
                                        }
                                    >
                                        {position.delta}
                                    </TableCell>
                                    <TableCell
                                        className={
                                            Number(position.deltaValue) > 0
                                                ? "text-green-600 font-bold"
                                                : Number(position.deltaValue) < 0
                                                    ? "text-red-600 font-bold"
                                                    : ""
                                        }
                                    >
                                        {Number(position.deltaValue).toFixed(2)}
                                    </TableCell>

                                    <TableCell className="mx-1 border-l border-black">
                                        <Input
                                            type="text"
                                            className={`w-30 ${Number(position.onShelf) < 0 ? "border-red-600 bg-red-100" : ""}`}
                                            value={position.onShelf}
                                            onFocus={e => {
                                                e.target.select();
                                            }}
                                            onChange={e => {
                                                const value = e.target.value.replaceAll(",", ".");
                                                const dotIndex = value.indexOf(".");
                                                const sanitizedValue =
                                                    dotIndex === -1
                                                        ? value
                                                        : value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replaceAll(".", "");

                                                const num = Number(sanitizedValue);

                                                setSheetData((prev) =>
                                                    prev?.map((p) =>
                                                        p.id === position.id
                                                            ? {
                                                                ...p,
                                                                onShelf: Number(sanitizedValue || 0),
                                                                newDelta: Number((num - Number(p.onPcMarket)).toFixed(3))
                                                            }
                                                            : p
                                                    ) || null
                                                );
                                            }}
                                            onBlur={() => {
                                                setSheetData((prev) =>
                                                    prev?.map((p) =>
                                                        p.id === position.id
                                                            ? {
                                                                ...p,
                                                                onShelf: Number((Number(p.newDelta) + Number(p.onPcMarket)).toFixed(3))
                                                            }
                                                            : p
                                                    ) || null
                                                );
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="mx-1">{position.onPcMarket}</TableCell>
                                    <TableCell
                                        className={`mx-1 ${Number(position.newDelta) > 0
                                            ? "text-green-600 font-bold"
                                            : Number(position.newDelta) < 0
                                                ? "text-red-600 font-bold"
                                                : "text-black font-bold"
                                            }`}
                                    >
                                        <Input
                                            type="text"
                                            className="w-30"
                                            value={position.newDelta}
                                            onFocus={e => {
                                                e.target.select();
                                            }}
                                            onChange={e => {
                                                const value = e.target.value.replaceAll(",", ".");
                                                const dotIndex = value.indexOf(".");
                                                const sanitizedValue_temp =
                                                    dotIndex === -1
                                                        ? value
                                                        : value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replaceAll(".", "");
                                                const sanitizedValue = sanitizedValue_temp.startsWith('-')
                                                    ? '-' + sanitizedValue_temp.replace(/^-/, '')
                                                    : sanitizedValue_temp;
                                                const num = Number(sanitizedValue);

                                                setSheetData((prev) =>
                                                    prev?.map((p) =>
                                                        p.id === position.id
                                                            ? {
                                                                ...p,
                                                                newDelta: Number(sanitizedValue || 0),
                                                                onShelf: !isNaN(num)
                                                                    ? Number((num + Number(p.onPcMarket)).toFixed(3))
                                                                    : Number((Number(p.onPcMarket)).toFixed(3))
                                                            }
                                                            : p
                                                    ) || null
                                                );
                                            }}
                                            onBlur={() => {
                                                setSheetData((prev) =>
                                                    prev?.map((p) =>
                                                        p.id === position.id
                                                            ? {
                                                                ...p,
                                                                newDelta: Number((Number(p.onShelf) - Number(p.onPcMarket)).toFixed(3))
                                                            }
                                                            : p
                                                    ) || null
                                                );
                                            }}
                                            step="any"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={
                                                Number(position.newDelta) * Number(position.RetailPrice) > 0
                                                    ? "text-green-600 font-bold"
                                                    : Number(position.newDelta) * Number(position.RetailPrice) < 0
                                                        ? "text-red-600 font-bold"
                                                        : ""
                                            }
                                        >
                                            {(Number(position.newDelta) * Number(position.RetailPrice)).toFixed(2)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="text-xl">
                                <TableCell colSpan={2}></TableCell>
                                <TableCell className="font-medium text-end border-l border-black" colSpan={2}>Wartość:</TableCell>
                                <TableCell colSpan={2} className="text-end">
                                    <span className={
                                        Number(sheetData?.reduce((acc: number, pos: SheetPosition) => acc + pos.deltaValue, 0)) > 0
                                            ? "text-green-600 font-bold"
                                            : Number(sheetData?.reduce((acc: number, pos: SheetPosition) => acc + pos.deltaValue, 0)) < 0
                                                ? "text-red-600 font-bold"
                                                : ""
                                    }>
                                        {Number(sheetData?.reduce((acc: number, pos: SheetPosition) => acc + pos.deltaValue, 0)).toFixed(2)}
                                    </span>
                                </TableCell>
                                <TableCell className="font-medium text-end border-l border-black" colSpan={2}></TableCell>
                                <TableCell colSpan={2} className="text-end ">
                                    <span className={
                                        Number(sheetData?.reduce((acc: number, pos: SheetPosition) => acc + (Number(pos.newDelta || 0) * Number(pos.RetailPrice || 0)), 0)) > 0
                                            ? "text-green-600 font-bold"
                                            : Number(sheetData?.reduce((acc: number, pos: SheetPosition) => acc + (Number(pos.newDelta || 0) * Number(pos.RetailPrice || 0)), 0)) < 0
                                                ? "text-red-600 font-bold"
                                                : ""
                                    }>
                                        {Number(sheetData?.reduce((acc: number, pos: SheetPosition) => acc + (Number(pos.newDelta || 0) * Number(pos.RetailPrice || 0)), 0)).toFixed(2)}
                                    </span>
                                </TableCell>
                            </TableRow>
                            <TableRow className="text-sm">
                                <TableCell colSpan={10} className="text-left text-muted-foreground">
                                    <Button
                                        className="w-full p-5 mt-5 mb-3"
                                        disabled={sheetData?.some((pos) => isNaN(Number(pos.onShelf)) || isNaN(Number(pos.newDelta)) || pos.onShelf < 0)}
                                        onClick={signSheet}>
                                        Podpisz arkusz
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </>}
            </DialogContent>
        </Dialog>
    )
}

export default SignSheet;