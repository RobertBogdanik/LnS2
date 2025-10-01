import { useSheetCardStore } from "@/context/sheetCard";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useCallback, useEffect, useState } from "react";
import axiosInterface from "@/config/axios";
import { Button } from "../ui/button";
import { IoMdDownload } from "react-icons/io";
import { useProductCardStore } from "@/context/productCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import axios from "axios";
import { FiPrinter } from "react-icons/fi";

const SheetCard = () => {
    const { isOpen, sheetId, closeModal, setLastChange } = useSheetCardStore();
    const { openProductCard, isProductCardOpen } = useProductCardStore();
    type SheetData = {
        basic: {
            id: number;
            name: string;
            removed_at?: string | null;
            removed_by?: { username?: string };
            closed_at?: string | null;
            signing_at?: string | null;
            signing_by?: { username?: string };
            created_at?: string | null;
            author?: { username?: string };
            closed_by?: { username?: string };
            comment?: string;
            active: boolean;
            dynamic?: boolean;
            temp?: boolean;
            mainCount?: boolean;
        };
        products?: Array<{
            id: number;
            productDetail: {
                TowId: number;
                ItemName: string;
                MainCode: string;
                ExtraCodes: string;
            };
            isDisabled?: boolean;
            delta: number;
            deltaValue: number;
        }>;
        imports?: Array<{
            id: number;
            isDisabled?: boolean;
            type: number;
            positions: Array<{
                id: number;
                productDetail: {
                    TowId: number;
                    ItemName: string;
                    MainCode: string;
                    ExtraCodes: string;
                };
                isDisabled?: boolean;
                expectedQuantity: number;
                quantity: number;
                delta: number;
                deltaValue: number;
            }>;
        }>;
    };

    const [sheetData, setSheetData] = useState<SheetData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadSheet = useCallback(async () => {
        if (!sheetId) return;

        setIsLoading(true);
        const res = await axiosInterface.get(`sheet/${sheetId}`);
        setSheetData(res.data);
        setIsLoading(false);
    }, [sheetId]);

    useEffect(() => {
        if (isOpen) {
            loadSheet();
        }
    }, [isOpen, loadSheet]);

    const handleDownloadPDF = useCallback(() => {
        if (!sheetId) return;
        try {
            const fileUrl = `http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=sheets/basic/${sheetData?.basic?.name}.pdf`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = `${sheetData?.basic?.name}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
    }, [sheetData, sheetId]);

    const handlePrintPDF = useCallback(() => {
        if (!sheetId) return;
        
        const download = async () => {
            try {
                
                const printer = localStorage.getItem("printer");
                
                const res = await axiosInterface.get(`raports/print?pathToPdf=sheets/basic/${sheetData?.basic?.name}.pdf&printer=${printer}`).then(res => res.data)

                if(res.success) toast.success(res.message)
                else toast.error(res.message)
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download()
    }, [sheetData, sheetId]);

    const handleDownloadKreski = useCallback(() => {
        if (!sheetId) return;

        const download = async () => {
            try {
                const path = await axiosInterface.get(`pdf/sheet/${sheetData?.basic?.id}/kreski`).then(res => res.data)

                const fileUrl = `http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=${path}`;
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = `${sheetData?.basic?.name}_kreski.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download();
    }, [sheetData, sheetId]);

    const handlePrintKreski = useCallback(() => {
        if (!sheetId) return;

        const download = async () => {
            try {
                const path = await axiosInterface.get(`pdf/sheet/${sheetData?.basic?.id}/kreski`).then(res => res.data)
                const printer = localStorage.getItem("printer");
                
                const res = await axiosInterface.get(`raports/print?pathToPdf=${path}&printer=${printer}`).then(res => res.data)

                if(res.success) toast.success(res.message)
                else toast.error(res.message)
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download();
    }, [sheetData, sheetId]);

    const handleDownloadDynSumUp= useCallback(() => {
        if (!sheetId) return;

        const download = async () => {
            try {
                const path = await axiosInterface.get(`pdf/sheet/${sheetData?.basic?.id}/dynsumup`).then(res => res.data)

                const fileUrl = `http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=${path}`;
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = `${sheetData?.basic?.name}_dynsumup.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download();
    }, [sheetData, sheetId]);

    const handlePrintDynSumUp= useCallback(() => {
        if (!sheetId) return;

        const download = async () => {
            try {
                const path = await axiosInterface.get(`pdf/sheet/${sheetData?.basic?.id}/dynsumup`).then(res => res.data)
                const printer = localStorage.getItem("printer");
                
                const res = await axiosInterface.get(`raports/print?pathToPdf=${path}&printer=${printer}`).then(res => res.data)

                if(res.success) toast.success(res.message)
                else toast.error(res.message)
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download();
    }, [sheetData, sheetId]);

    const handleDownloadDynamic = useCallback(() => {
        if (!sheetId) return;
            const download = async () => {
            if (!sheetId) return;
            try{
                const fileUrl = `http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=sheets/dynamic/${sheetData?.basic?.name}_dynamic.pdf`;
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = `${sheetData?.basic?.name}_dynamic.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download();
    }, [sheetData, sheetId]);

    const handlePrintDynamic = useCallback(() => {
        if (!sheetId) return;
            const download = async () => {
            if (!sheetId) return;
            try{
                
                const printer = localStorage.getItem("printer");
                
                const res = await axiosInterface.get(`raports/print?pathToPdf=sheets/dynamic/${sheetData?.basic?.name}_dynamic.pdf&printer=${printer}`).then(res => res.data)

                if(res.success) toast.success(res.message)
                else toast.error(res.message)
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download();
    }, [sheetData, sheetId]);

    const handleDownloadPodladka = useCallback(() => {
        if (!sheetId) return;

        const download = async () => {
            try {
                const path = await axiosInterface.get(`pdf/sheet/${sheetData?.basic?.id}/podkladka`).then(res => res.data)
                const fileUrl = `http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=${path}`;
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = `${sheetData?.basic?.name}_podkladka.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można pobrać podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas pobierania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download();
    }, [sheetData, sheetId]);

    const handlePrintPodladka = useCallback(() => {
        if (!sheetId) return;

        const download = async () => {
            try {
                const path = await axiosInterface.get(`pdf/sheet/${sheetData?.basic?.id}/podkladka`).then(res => res.data)
                const printer = localStorage.getItem("printer");
                
                const res = await axiosInterface.get(`raports/print?pathToPdf=${path}&printer=${printer}`).then(res => res.data)

                if(res.success) toast.success(res.message)
                else toast.error(res.message)
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 400) {
                    toast.error("Nie można wydrukować podsumowania.", {
                        description: error.response?.data?.message || "Wystąpił błąd podczas drukowania podsumowania."
                    });
                    return;
                }
                return;
            }
        }

        download();
    }, [sheetData, sheetId]);

    const finalizeSheet = useCallback(async () => {
        setIsLoading(true);
        const res = await axiosInterface.post(`sheet`, {
            origin: sheetData?.basic?.id,
            piku: 'A'
        });

        if (res.status === 200) {
            toast.success(`Arkusz ${sheetData?.basic?.name} został zfinalizowany.`);
        }
        

        loadSheet();
    }, [loadSheet, sheetData])

    const cancelSheet = useCallback(async () => {
        const res = await axiosInterface.delete(`sheet/${sheetData?.basic?.id}`);

        if (res.status === 200) {
            toast.success(`Arkusz ${res.data?.name} został odblokowany.`);
            setLastChange(new Date());
            loadSheet();
        }
    }, [loadSheet, sheetData, setLastChange])

    const closeSheet = () => {
        if (!sheetData?.basic?.id) return;

        axiosInterface.put(`sheet/${sheetData.basic.id}/close`)
            .then(res => {
                if (res.status === 200) {
                    toast.success(`Arkusz ${sheetData?.basic?.name} został zamknięty i przeznaczony do weryfikacji.`);
                    setLastChange(new Date());
                    loadSheet();
                }
            })
            .catch(err => {
                toast.error('Błąd podczas zamykania arkusza', {
                    description: err.response?.data?.message || err.message,
                });
            });
    }

    const exportSheet = async () => {
        if (!sheetData?.basic?.id) return;
        const path = await axiosInterface.get(`export/exportSheet/${sheetData?.basic?.id}`)
        const fileUrl = `http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=${path.data}`
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${sheetData?.basic?.name}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="sm:max-w-[1200px]">
                {isLoading && <>
                    <DialogTitle>Arkusz</DialogTitle>
                </>}
                {!isLoading && <>
                    <DialogHeader className="text-lg font-semibold">
                        <DialogTitle>Arkusz {sheetData?.basic?.name} [{sheetData?.basic?.id}]</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList>
                            <TabsTrigger value="details">Szczegóły</TabsTrigger>
                            <TabsTrigger value="products">Produkty</TabsTrigger>
                            <TabsTrigger value="imports">Importy</TabsTrigger>
                            <TabsTrigger value="downloads">Pobieranie</TabsTrigger>
                            <TabsTrigger value="service">Operacje serwisowe</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details">
                            {sheetData?.basic?.removed_at && <div>
                                <h1 className="text-3xl mt-5 text-center font-bold text-red-600">
                                    Usunięto dnia {sheetData?.basic?.removed_at
                                        ? new Date(sheetData.basic.removed_at).toLocaleString('pl-PL', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })
                                        : ''} przez {sheetData?.basic?.removed_by?.username || '--'}
                                </h1>
                            </div>}
                            {!sheetData?.basic?.removed_at && <>
                                <div className="flex gap-6 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Status</span>
                                        {sheetData?.basic?.removed_at ? (
                                            <Badge className="bg-red-500 text-white">Usunięty</Badge>
                                        ) : sheetData?.basic?.closed_at && sheetData?.basic?.signing_at ? (
                                            <Badge className="bg-black text-white">Zatwierdzony</Badge>
                                        ) : sheetData?.basic?.closed_at && !sheetData?.basic?.signing_at ? (
                                            <Badge className="bg-yellow-500 text-white">Do zatwierdzenia</Badge>
                                        ) : !sheetData?.basic?.closed_at ? (
                                            <Badge className="bg-green-600 text-white">Otwarty</Badge>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Aktywne</span>
                                        <Badge className={sheetData?.basic.active ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                                            {sheetData?.basic.active ? "Tak" : "Nie"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Statyczny</span>
                                        <Badge className={!sheetData?.basic?.dynamic ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                                            {!sheetData?.basic?.dynamic ? "Tak" : "Nie"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Ostateczny</span>
                                        <Badge className={!sheetData?.basic?.temp ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                                            {!sheetData?.basic?.temp ? "Tak" : "Nie"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Liczenie głowne</span>
                                        <Badge className={sheetData?.basic?.mainCount ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                                            {sheetData?.basic?.mainCount ? "Tak" : "Nie"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Stworzono</div>
                                        <div className="font-medium">
                                            <input
                                                type="datetime-local"
                                                value={sheetData?.basic?.created_at ? new Date(sheetData.basic.created_at).toISOString().slice(0, 16) : ''}
                                                disabled
                                                className="w-full rounded border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Autor</div>
                                        <div className="font-medium">{sheetData?.basic?.author?.username || '--'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Przeznaczone do weryfikacji</div>
                                        <div className="font-medium">
                                            <input
                                                type="datetime-local"
                                                value={sheetData?.basic?.closed_at ? new Date(sheetData.basic.closed_at).toISOString().slice(0, 16) : ''}
                                                disabled
                                                className="w-full rounded border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Importer</div>
                                        <div className="font-medium">{sheetData?.basic?.closed_by?.username || '--'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Zweryfikowany</div>
                                        <div className="font-medium">
                                            <input
                                                type="datetime-local"
                                                value={sheetData?.basic?.signing_at ? new Date(sheetData.basic.signing_at).toISOString().slice(0, 16) : ''}
                                                disabled
                                                className="w-full rounded border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Zweryfikowane przez</div>
                                        <div className="font-medium">{sheetData?.basic?.signing_by?.username || '--'}</div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <label htmlFor="komentarz" className="block text-sm font-medium text-muted-foreground mb-1">
                                        Komentarz
                                    </label>
                                    <textarea
                                        id="komentarz"
                                        name="komentarz"
                                        rows={3}
                                        disabled
                                        value={sheetData?.basic?.comment || ''}
                                        className="w-full rounded border border-input bg-background px-3 py-2 text-sm disable resize-none disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                {sheetData?.basic?.temp && <div className="mt-6">
                                    <div className="flex items-center gap-4 w-full">
                                        <label htmlFor="finalize-select" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                                            Wybierz pikacza do finalizacji
                                        </label>
                                        <div className="flex-1">
                                            <Select>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="A" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A">A</SelectItem>
                                                    <SelectItem value="B">B</SelectItem>
                                                    <SelectItem value="C">C</SelectItem>
                                                    <SelectItem value="D">D</SelectItem>
                                                    <SelectItem value="E">E</SelectItem>
                                                    <SelectItem value="F">F</SelectItem>
                                                    <SelectItem value="G">G</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900 transition shadow flex-1"
                                            type="button"
                                            onClick={finalizeSheet}
                                        >
                                            Finalizuj
                                        </Button>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition shadow"
                                        type="button"
                                        onClick={cancelSheet}
                                    >
                                        Odblokuj produkty
                                    </Button>
                                </div>}
                            </>}
                        </TabsContent>
                        <TabsContent value="products" className="overflow-auto max-h-[400px] max-w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">TowId</TableHead>
                                        <TableHead>Nazwa</TableHead>
                                        <TableHead>Kod</TableHead>
                                        <TableHead>Aktywny</TableHead>
                                        <TableHead>Delta</TableHead>
                                        <TableHead>Wartosc</TableHead>
                                        <TableHead>Komentarz</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sheetData?.products?.map((position) => (
                                        <TableRow key={position.id}>
                                            <TableCell className="font-medium">{position.productDetail.TowId}</TableCell>
                                            <TableCell>{position.productDetail.ItemName}</TableCell>
                                            <TableCell>
                                                <strong>{position.productDetail.MainCode.replaceAll('?', '')}</strong>
                                                {position.productDetail.ExtraCodes
                                                    .split(';')
                                                    .filter((code: string) => code.trim() !== '')
                                                    .map((code: string, idx: number) => (
                                                        <div key={idx}>{code.replaceAll('?', '')}</div>
                                                    ))}
                                            </TableCell>
                                            <TableCell>{!position.isDisabled ? "Tak" : "Nie"}</TableCell>
                                            <TableCell>
                                                <span className={position.delta > 0 ? "text-green-600 font-bold" : position.delta < 0 ? "text-red-600 font-bold" : ""}>
                                                    {Number(position.delta).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={position.deltaValue > 0 ? "text-green-600 font-bold" : position.deltaValue < 0 ? "text-red-600 font-bold" : ""}>
                                                    {Number(position.deltaValue).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button disabled={isProductCardOpen} onClick={() => openProductCard(position.productDetail.TowId)}>
                                                    Karta produktu
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="text-xl">
                                        <TableCell className="font-medium text-end" colSpan={5}>Razem</TableCell>
                                        <TableCell colSpan={2}>
                                            <span className={
                                                Number(sheetData?.products?.reduce((acc: number, pos) => acc + pos.deltaValue, 0)) > 0
                                                    ? "text-green-600 font-bold"
                                                    : Number(sheetData?.products?.reduce((acc: number, pos) => acc + pos.deltaValue, 0)) < 0
                                                        ? "text-red-600 font-bold"
                                                        : ""
                                            }>
                                                {Number(sheetData?.products?.reduce((acc: number, pos) => acc + pos.deltaValue, 0)).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TabsContent>
                        <TabsContent value="imports" className="overflow-auto max-h-[400px] w-full">
                            <Accordion type="single">
                                {sheetData?.imports?.map((importItem) => (
                                    <AccordionItem key={importItem.id} value={`import-${importItem.id}`} className="w-full">
                                        <AccordionTrigger>
                                            <div>
                                                <Badge className={importItem.isDisabled ? "bg-red-600 text-white mr-5" : "bg-green-600 text-white mr-2"}>
                                                    {importItem.isDisabled ? 'Nieaktywny' : 'Aktywny'}
                                                </Badge>
                                                {importItem.type === 1 && 'Import '}
                                                {importItem.type === 2 && 'Zmiana delty '}
                                                {importItem.type === 3 && 'Korekta '}
                                                {importItem.id} ({importItem.positions.length} pozycji)
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="w-full">
                                            <div className="w-full overflow-x-auto">
                                                <Table className=" w-full">
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[100px]">TowId</TableHead>
                                                            <TableHead className="max-w-[200px] whitespace-pre-wrap break-words">Nazwa</TableHead>
                                                            <TableHead>Kod</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead>Oczekiwano</TableHead>
                                                            <TableHead>Policzono</TableHead>
                                                            <TableHead>Delta</TableHead>
                                                            <TableHead>Rozbieżność</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {importItem.positions.map((position) => (
                                                            <TableRow key={position.id}>
                                                                <TableCell className="font-medium">{position.productDetail.TowId}</TableCell>
                                                                <TableCell>{position.productDetail.ItemName}</TableCell>
                                                                <TableCell>
                                                                    <strong>{position.productDetail.MainCode.replaceAll('?', '')}</strong>
                                                                    {position.productDetail.ExtraCodes
                                                                        .split(';')
                                                                        .filter((code: string) => code.trim() !== '')
                                                                        .map((code: string, idx: number) => (
                                                                            <div key={idx}>{code.replaceAll('?', '')}</div>
                                                                        ))}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={position.isDisabled || importItem.isDisabled ? "bg-red-600 text-white" : "bg-green-600 text-white"}>
                                                                        {position.isDisabled || importItem.isDisabled ? "Nieaktywny" : "Aktywny"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>{Number(position.expectedQuantity).toFixed(3)}</TableCell>
                                                                <TableCell>{Number(position.quantity).toFixed(3)}</TableCell>
                                                                <TableCell>
                                                                    <span className={
                                                                        position.delta > 0
                                                                            ? "text-green-600 font-bold"
                                                                            : position.delta < 0
                                                                                ? "text-red-600 font-bold"
                                                                                : ""
                                                                    }>
                                                                        {Number(position.delta).toFixed(2)}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className={
                                                                        position.deltaValue > 0
                                                                            ? "text-green-600 font-bold"
                                                                            : position.deltaValue < 0
                                                                                ? "text-red-600 font-bold"
                                                                                : ""
                                                                    }>
                                                                        {Number(position.deltaValue).toFixed(2)}
                                                                    </span>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </TabsContent>
                        <TabsContent value="downloads">
                            {!sheetData?.basic?.temp &&<div className="flex flex-col gap-4 mt-4">
                                {!sheetData?.basic?.dynamic && <>
                                    <div className="flex gap-4 items-start">
                                        <Button
                                            onClick={handlePrintPDF}
                                            className="flex-1"
                                        >
                                            <FiPrinter className="w-5 h-5 mr-2" />
                                            Drukuj arkusz
                                        </Button>
                                        
                                        <Button
                                            onClick={handleDownloadPDF}
                                            variant="outline"
                                            className="whitespace-nowrap min-w-[210px]"
                                        >
                                            <IoMdDownload className="w-5 h-5 mr-2" />
                                            Pobierz arkusz
                                        </Button>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <Button
                                            onClick={handlePrintKreski}
                                            className="flex-1"
                                        >
                                            <FiPrinter className="w-5 h-5 mr-2" />
                                            Drukuj kreski
                                        </Button>
                                        
                                        <Button
                                            onClick={handleDownloadKreski}
                                            variant="outline"
                                            className="whitespace-nowrap min-w-[210px]"
                                        >
                                            <IoMdDownload className="w-5 h-5 mr-2" />
                                            Pobierz kreski
                                        </Button>
                                    </div>
                                </>}
                                {sheetData?.basic?.dynamic && (
                                    <div className="flex gap-4 items-start">
                                        <Button
                                            onClick={handlePrintDynamic}
                                            className="flex-1"
                                        >
                                            <FiPrinter className="w-5 h-5 mr-2" />
                                            Drukuj potwierdzenie dynamicznego
                                        </Button>
                                        
                                        <Button
                                            onClick={handleDownloadDynamic}
                                            variant="outline"
                                            className="whitespace-nowrap"
                                        >
                                            <IoMdDownload className="w-5 h-5 mr-2" />
                                            Pobierz potwierdzenie dynamicznego
                                        </Button>
                                    </div>
                                )}
                                {sheetData?.basic?.closed_at && (
                                    <div className="flex gap-4 items-start">
                                        <Button
                                            onClick={handlePrintDynSumUp}
                                            className="flex-1"
                                        >
                                            <FiPrinter className="w-5 h-5 mr-2" />
                                            Drukuj podsumowanie
                                        </Button>
                                        
                                        <Button
                                            onClick={handleDownloadDynSumUp}
                                            variant="outline"
                                            className="whitespace-nowrap min-w-[210px]"
                                        >
                                            <IoMdDownload className="w-5 h-5 mr-2" />
                                            Pobierz podsumowanie
                                        </Button>
                                    </div>
                                )}
                                {sheetData?.basic?.signing_at && (
                                    <div className="flex gap-4 items-start">
                                        <Button
                                        onClick={handlePrintPodladka}
                                        className="flex-1"
                                        >
                                            <FiPrinter className="w-5 h-5 mr-2" />
                                            Drukuj podkładka
                                        </Button>
                                        
                                        <Button
                                            onClick={handleDownloadPodladka}
                                            variant="outline"
                                            className="whitespace-nowrap min-w-[210px]"
                                        >
                                            <IoMdDownload className="w-5 h-5 mr-2" />
                                            Pobierz podkładka
                                        </Button>
                                    </div>
                                )}
                            </div>}
                        </TabsContent>
                        <TabsContent value="service">
                            <div className="flex flex-col gap-4 mt-4">
                                {!sheetData?.basic?.closed_at && !sheetData?.basic?.removed_at && <Button
                                    variant="destructive"
                                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition shadow"
                                    onClick={closeSheet}
                                >
                                    Zamknij arkusz i przeznacz do weryfikacji
                                </Button>}
                                {sheetData?.basic?.signing_at && <Button
                                    className="w-full px-4 py-2 rounded transition shadow"
                                    onClick={exportSheet}
                                >
                                    Eksportuj
                                </Button>}
                            </div>
                        </TabsContent>
                    </Tabs>
                </>}
            </DialogContent>
        </Dialog >
    )

}

export default SheetCard;