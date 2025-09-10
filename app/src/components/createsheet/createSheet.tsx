import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import React, { useCallback, useEffect } from "react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { IoMdDownload } from "react-icons/io";
import axiosInterface from "@/config/axios";


type SheetProduct = {
    TowId: number;
    MainCode: string;
    ItemName: string;
};

type TempSheetData = {
    createdSheet?: boolean;
    sheet?: { id: number };
    name?: string;
    products?: number;
    print?: { printer: string };
    basicPdf?: { filePath: string };
    id?: number;
    passed: SheetProduct[];
    notActive: SheetProduct[];
    used: SheetProduct[];
    notFound: string[];
};

const CreateSheet = ({
    isOpen,
    list,
    onClose
}: {
    isOpen: boolean;
    list: number[];
    onClose: () => void
}) => {
    const [step, setStep] = React.useState(0);
    const [data, setData] = React.useState<TempSheetData>({ passed: [], notActive: [], used: [], notFound: [] });


    const createSheet = useCallback(async (sheetId: number) => {
        setStep(2);

        const res = await axiosInterface.post('/sheet/', {
            origin: sheetId,
            piku: 'A' //TODO: make dynamic
        });

        setData(res.data);
        setStep(3);
    }, []);

    const createTempSheet = useCallback(async () => {
        const res = await axiosInterface.post('/sheet/temp', { products: list, piku: 'A' }); //TODO: make dynamic

        setData(res.data);

        if (!res.data.createdSheet || res.data?.passed.length == 0) {
            setStep(4);
            return;
        }

        if (
            (!res.data?.notActive || res.data.notActive.length === 0) &&
            (!res.data?.used || res.data.used.length === 0) &&
            (!res.data?.notFound || res.data.notFound.length === 0)
        ) {
            createSheet(res.data.sheet.id);
            return;
        }
        setStep(1);
    }, [list, createSheet]);

    useEffect(() => {
        if (isOpen) {
            createTempSheet();
        }
    }, [isOpen, createTempSheet]);


    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                {(step == 0 || step == 2) && <div className="flex justify-center mt-3 h-5 space-x-2">
                    <div className="w-3 h-5 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-3 h-5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-3 h-5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
                </div>}
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-medium text-center">
                        {step == 0 && <>Weryfikowanie</>}
                        {step == 1 && <>Podgląd</>}
                        {step == 2 && <>Zapisywanie</>}
                        {step == 3 && <>Podsumowanie</>}
                        {step == 4 && <span className="text-red-500">Wystąpił Błąd</span>}
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="text-muted-foreground text-sm text-center max-h-[70vh] overflow-y-auto pr-2">
                    {step == 0 && <>Proszę czekać, trwa weryfikowanie danych...</>}
                    {step == 1 && <div className="text-black text-left">
                        Wykryto <strong>{data?.passed.length}</strong> produktów do dodania w arkuszu.
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                        >
                            <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    <div className="flex">
                                        Produkty Zgodne <Badge variant={"outline"} className="ms-2">{data?.passed.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <ul className="list-disc ps-6 text-sm text-black">
                                        {data?.passed.map((item: SheetProduct) => (
                                            <li key={item.TowId}>
                                                <strong>{item.MainCode}</strong><br />
                                                {item.ItemName}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            {data?.notActive.length !== 0 && <AccordionItem value="item-2">
                                <AccordionTrigger>
                                    <div className="flex">
                                        Produkty Usunięte <Badge variant={"destructive"} className="ue-600 ms-2">{data?.notActive.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <ul className="list-disc ps-6 text-sm text-black">
                                        {data?.notActive.map((item: SheetProduct) => (
                                            <li key={item.TowId}>
                                                <strong>{item.MainCode}</strong><br />
                                                {item.ItemName}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>}
                            {data?.used.length !== 0 && <AccordionItem value="item-3">
                                <AccordionTrigger>
                                    <div className="flex">
                                        Produkty Liczone <Badge variant={"destructive"} className="ms-2">{data?.used.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <ul className="list-disc ps-6 text-sm text-black">
                                        {data?.used.map((item: SheetProduct) => (
                                            <li key={item.TowId}>
                                                <strong>{item.MainCode}</strong><br />
                                                {item.ItemName}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>}
                            {data?.notFound.length !== 0 && <AccordionItem value="item-4">
                                <AccordionTrigger>
                                    <div className="flex">
                                        Produkty Nieznalezione <Badge variant={"destructive"} className="ms-2">{data?.notFound.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <ul className="list-disc ps-6 text-sm text-black">
                                        {data?.notFound.map((item: string, index: number) => (
                                            <li key={index}>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>}
                        </Accordion>
                        <Button
                            variant={"default"}
                            className="mt-4 w-full"
                            onClick={() => data.sheet?.id && createSheet(data.sheet.id)}
                            disabled={!data.sheet?.id}
                        >
                            Utwórz arkusz
                        </Button>
                    </div>}
                    {step == 2 && <>Zapisywanie danych...</>}
                    {step == 3 && <div className="flex flex-col text-left text-gray-950">
                        <div>
                            Arkusz <strong>{data.name}</strong> został utworzony z <strong>{data.products}</strong> produktami. Wygenerowano PDF i wysłano do drukarki <strong>{data.print?.printer}</strong>.
                        </div>

                        <Button
                            variant={"link"}
                            onClick={() => {
                                if (data?.basicPdf?.filePath) {
                                    window.open(`http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=${encodeURIComponent(data.basicPdf.filePath)}`, '_blank');
                                }
                            }}
                        >
                            <IoMdDownload />
                            Pobierz PDF
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                if (data?.id) {
                                    window.location.href = `/v2/sheet/${data.id}`;
                                }
                            }}
                            variant={'outline'}
                            className="mb-1 mt-3"
                        >
                            Otwórz arkusz
                        </Button>
                        <Button type="button" onClick={onClose}>Zamknij</Button>
                    </div>}
                    {step == 4 && <div className="text-black text-left">
                        Wysłano <strong>{list.length}</strong> produktów. Arkusz nie został zapisany.
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                        >
                            {data?.passed.length !== 0 && <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    <div className="flex">
                                        Produkty Zgodne <Badge variant={"outline"} className="ms-2">{data?.passed.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <ul className="list-disc ps-6 text-sm text-black">
                                        {data?.passed.map((item: SheetProduct) => (
                                            <li key={item.TowId}>
                                                <strong>{item.MainCode}</strong><br />
                                                {item.ItemName}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>}
                            {data?.notActive.length !== 0 && <AccordionItem value="item-2">
                                <AccordionTrigger>
                                    <div className="flex">
                                        Produkty Usunięte <Badge variant={"destructive"} className="ue-600 ms-2">{data?.notActive.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <ul className="list-disc ps-6 text-sm text-black">
                                        {data?.notActive.map((item: SheetProduct) => (
                                            <li key={item.TowId}>
                                                <strong>{item.MainCode}</strong><br />
                                                {item.ItemName}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>}
                            {data?.used.length !== 0 && <AccordionItem value="item-3">
                                <AccordionTrigger>
                                    <div className="flex">
                                        Produkty Liczone <Badge variant={"destructive"} className="ms-2">{data?.used.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <ul className="list-disc ps-6 text-sm text-black">
                                        {data?.used.map((item: SheetProduct) => (
                                            <li key={item.TowId}>
                                                <strong>{item.MainCode}</strong><br />
                                                {item.ItemName}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>}
                            {data?.notFound.length !== 0 && <AccordionItem value="item-4">
                                <AccordionTrigger>
                                    <div className="flex">
                                        Produkty Nieznalezione <Badge variant={"destructive"} className="ms-2">{data?.notFound.length}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <ul className="list-disc ps-6 text-sm text-black">
                                        {data?.notFound.map((item: string, index: number) => (
                                            <li key={index}>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>}
                        </Accordion>

                        <Button variant={"default"} className="mt-4 w-full" onClick={onClose}>
                            Zamknij
                        </Button>

                    </div>}
                </div>
                {/* </AlertDialogHeader> */}
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default CreateSheet;