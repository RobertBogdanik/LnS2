"use client"

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { LuFileSpreadsheet, LuStamp } from "react-icons/lu";
import { MdOutlineAdd } from "react-icons/md";
import { CiImport, CiExport } from "react-icons/ci";
import SheetCard from "@/components/sheet/sheetCard"
import ProductCard from "@/components/product/productCard"

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className="flex flex-col min-h-screen">
            <ProductCard />
            <div className="relative h-1 w-full rounded overflow-hidden">
                <div className="absolute inset-0 flex w-full h-full">
                    <div className="w-[30%] bg-red-400" />
                    <div className="w-[10%] bg-white" />
                    <div className="w-[60%] bg-black" />
                </div>
            </div>
            <nav className="flex justify-between items-center border-b px-6 py-3 bg-white">
                {/* Left side – links */}
                <div className="flex items-center gap-4">

                    <Link href="/v2/">
                        <Button variant="link" className="active underline"><MdOutlineAdd />Tworzenie</Button>
                    </Link>
                    <Link href="/v2/arkusze">
                        <Button variant="link"><LuFileSpreadsheet />Arkusze</Button>
                    </Link>
                    <Link href="/v2/import">
                        <Button variant="link"><CiImport />Import</Button>
                    </Link>
                    <Link href="/v2/eksport">
                        <Button variant="link"><CiExport />Eksport</Button>
                    </Link>
                    {/* <Link href="/v2/raporty">
                        <Button variant="link"><IoDocumentTextOutline />Raporty</Button>
                    </Link> */}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Input placeholder="Szukaj..." className="w-48 pr-10" />
                    </div>

                    <Link href="/v2/arkusze/podpisz" className="relative flex items-center justify-center h-10 w-10 rounded-md bg-transparent hover:bg-accent focus:outline-none">
                        <LuStamp />
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    </Link>

                    <DropdownMenu>
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
                            {/* <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    Przełączanie bazy danych
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent alignOffset={-5}>
                                    <DropdownMenuItem>2025</DropdownMenuItem>
                                    <DropdownMenuItem>2024</DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub> */}
                            <DropdownMenuItem>Wyloguj</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </nav >
            <SheetCard />
            {children}
        </div >
    )
}
