"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { LuFileSpreadsheet } from "react-icons/lu";
import { MdOutlineAdd } from "react-icons/md";
import { CiImport, CiExport, CiSettings } from "react-icons/ci";
import SheetCard from "@/components/sheet/sheetCard"
import ProductCard from "@/components/product/productCard"
import { PiStampThin } from "react-icons/pi";
import { usePathname } from "next/navigation";
import SearchModal from "@/components/search/searchModal";
import { useSearchModalStore } from "@/context/search";
import { useUserStore } from "@/context/user";
import { useEffect, useMemo, useState } from "react";
import jwt from 'jsonwebtoken';
import { toast } from "sonner";
import axiosInterface from "@/config/axios";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const {openSearchModal} = useSearchModalStore();
    const logout = () => {
        sessionStorage.clear();
        window.location.href = '/';
    }

    const pathname = usePathname();

    const {
        userName,
        setUser,
        isAdmin
    } = useUserStore();

    const navLinks = useMemo(() => ([
        { href: "/v2/", label: "Tworzenie", icon: <MdOutlineAdd />, admin: false },
        { href: "/v2/arkusze", label: "Arkusze", icon: <LuFileSpreadsheet />, admin: false },
        { href: "/v2/import", label: "Import", icon: <CiImport />, admin: true },
        { href: "/v2/eksport", label: "Eksport", icon: <CiExport />, admin: true },
        { href: "/v2/arkusze/podpisz", label: "Podpisywanie", icon: <PiStampThin />, admin: false },
        { href: "/v2/ustawienia", label: "Ustawienia", icon: <CiSettings />, admin: true },
    ]), []);

    useEffect(() => {
        const token = sessionStorage.getItem("jwt");
        if (!token) {
            toast.error("Brak tokenu dostępu");
            logout();
            return;
        }

        const decoded = jwt.decode(token);
        if (
            decoded &&
            typeof decoded === "object" &&
            "usid" in decoded &&
            "userName" in decoded &&
            "isAdmin" in decoded &&
            "defaultPiku" in decoded
        ) {
            const data = decoded as {
                usid: number;
                userName: string;
                isAdmin: boolean;
                defaultPiku: string;
            };
            setUser(data.usid, data.userName, data.isAdmin, data.defaultPiku);
        } else {
            toast.error("Nieprawidłowy token dostępu");
            logout();
        }
    }, [setUser]);

    const [stats, setStats] = useState<{ notActive: number; inCount: number; toCount: number, inCountAlt: number, toCountAlt: number }>({
        notActive: 0,
        inCount: 0,
        toCount: 100,
        inCountAlt: 0,
        toCountAlt: 0
    });

    useEffect(() => {
        axiosInterface.get('/products/stats')
            .then(response => {
                const { notActive, inCount, toCount, total } = response.data;
                setStats({ 
                    notActive: (notActive / total) * 100, 
                    inCount: (inCount / total) * 100, 
                    toCount: (toCount / total) * 100,
                    inCountAlt: (inCount / (inCount + toCount)) * 100,
                    toCountAlt: (toCount / (inCount + toCount)) * 100,
                 });
            })
            .catch(error => {
                console.error("Błąd podczas pobierania statystyk produktów:", error);
            });
    }, []);
    
    return (
        <div className="flex flex-col min-h-screen">
            <ProductCard />
            <SearchModal />
            <div className="relative h-1 w-screen rounded overflow-hidden">
                <div className="absolute inset-0 flex w-screen h-full">
                    <div className={`bg-red-400`} style={{ width: `${stats.notActive}%` }} />
                    <div className={`bg-white`} style={{ width: `${stats.toCount}%` }} />
                    <div className={`bg-black`} style={{ width: `${stats.inCount}%` }} />
                </div>
            </div>
            <div className="relative h-1 w-screen rounded overflow-hidden">
                <div className="absolute inset-0 flex w-screen h-full">
                    <div className={`bg-black`} style={{ width: `${stats.inCountAlt}%` }} />
                    <div className={`bg-white`} style={{ width: `${stats.toCountAlt}%` }} />
                </div>
            </div>
            <nav className="flex justify-between items-center border-b px-6 py-3 bg-white">
                <div className="flex items-center gap-4">

                    {navLinks
                        .filter(link => !link.admin || isAdmin)
                        .map(({ href, label, icon }) => (
                            <Link key={href} href={href}>
                                <Button
                                    variant="link"
                                    className={pathname === href ? "active underline" : ""}
                                >
                                    {icon}{label}
                                </Button>
                            </Link>
                        ))
                    }
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-bold text-red-600 block">{userName}</span>
                    <div className="relative">
                        <Input
                            placeholder="Szukaj..."
                            className="w-48 pr-10"
                            id="product-search-input"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                                openSearchModal((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                            }}
                        />
                    </div>
                    <Button onClick={logout} variant="outline" className="relative p-2 rounded-md hover:bg-accent focus:outline-none">
                        Wyloguj
                    </Button>

                    {/* <Link href="/v2/arkusze/podpisz" className="relative flex items-center justify-center h-10 w-10 rounded-md bg-transparent hover:bg-accent focus:outline-none">
                        <LuStamp />
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    </Link> */}

                    {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="cursor-pointer">
                                <AvatarImage src="/avatar.png" alt="Avatar" />
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" side="bottom">
                            <Link href="/v2/ustawienia">
                                <DropdownMenuItem className="cursor-pointer w-full">Ustawienia</DropdownMenuItem>
                            </Link>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    Przełączanie bazy danych
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent alignOffset={-5}>
                                    <DropdownMenuItem>2025</DropdownMenuItem>
                                    <DropdownMenuItem>2024</DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem>Wyloguj</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu> */}
                </div>
            </nav >
            <SheetCard />
            {children}
        </div >
    )
}
