"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInterface from "@/config/axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ConfigPage = () => {
    const [printers, setPrinters] = useState<Array<string>>([]);
    const [values, setValues] = useState<{ workstation: string; printer: string }>({
        workstation: "",
        printer: "",
    });

    useEffect(() => {
        const fetchPrinters = async () => {
            const data = await axiosInterface.get('/raports/printers');
            setPrinters(data.data);

            setValues({
                workstation: localStorage.getItem("workstation") || "",
                printer: localStorage.getItem("printer") || "",
            });
        };
        fetchPrinters();

    }, []);

    const createSysConf = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const workstation = formData.get("workstation") as string;

        if (!workstation) {
            toast.error("Nazwa stanowiska nie może być pusta.");
            return;
        }
        localStorage.setItem("workstation", workstation);

        const selectedPrinter = formData.get("printer") as string;

        if (!selectedPrinter) {
            toast.error("Nie wybrano drukarki.");
            return;
        }
        localStorage.setItem("printer", selectedPrinter);

        toast("Stanowisko zostało skonfigurowane", {
            description: "Nazwa stanowiska: " + workstation,
            action: {
                label: "Cofnij",
                onClick: () => {
                    localStorage.removeItem("workstation");
                    localStorage.removeItem("printer");
                    redirect('/config');
                },
            },
        });

        redirect('/');
    }

    return (<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
            <Card>
                <CardContent className="p-6 md:p-8 flex flex-col text-center gap-4">
                    <h1 className="text-4xl font-bold">Witamy w LnS<sub>2</sub></h1>
                    <p className="text-xl text-muted-foreground text-balance">
                        Wygląda na to, że to stanowisko nie jest jeszcze skonfigurowane.<br />
                        Skonfiguruj stanowisko, aby rozpocząć korzystanie z aplikacji.
                    </p>
                    <form onSubmit={createSysConf}>
                        <div className="text-sm mt-5">
                            <Label className="text-left">
                                Wprowadź nazwę stanowiska
                            </Label>
                            <Input
                                name="workstation"
                                type="text"
                                defaultValue={values.workstation}
                                className="w-full mt-2"
                            />
                        </div>
                        <div className="text-sm mt-5">
                            <Label className="text-left">
                                Drukarka
                            </Label>
                            {printers.length > 0 ? (
                                <div className="flex flex-col gap-2 mt-2">
                                    {printers.map((printer, index) => (
                                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="printer"
                                                value={printer}
                                                checked={values.printer === printer}
                                                onChange={() => setValues(v => ({ ...v, printer }))}
                                                className="accent-primary"
                                            />
                                            <span>{printer}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-muted-foreground text-sm">Brak dostępnych drukarek</span>
                            )}
                        </div>
                        <Button
                            className="w-full mt-5 text-xl p-7"
                            type="submit"
                        >
                            Skonfiguruj stanowisko
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    </div>
    );
};

export default ConfigPage;