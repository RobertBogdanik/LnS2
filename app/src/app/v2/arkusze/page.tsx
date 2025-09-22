"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import axiosInterface from "@/config/axios"
import { useCallback, useEffect, useState } from "react"
import { useSheetCardStore } from "@/context/sheetCard"
import { Button } from "@/components/ui/button"

const ArkuszPage = () => {
    const { openModal, lastChange } = useSheetCardStore();
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [searchFilters, setSearchFilters] = useState<string[]>(["open", "toBeApproved", "finished"])

    type ListParam = {
        total: number;
        perPage: number;
        currentPage: number;
    }
    const [listParam, setListParam] = useState<ListParam>({
        total: 0,
        perPage: 25,
        currentPage: 1,
    })

    type Sheet = {
        id: number;
        name: string;
        removed_at?: string | null;
        closed_at?: string | null;
        signing_at?: string | null;
        dynamic?: boolean;
        temp?: boolean;
        mainCount?: boolean;
        created_at?: string | null;
        // Add other fields as needed
    };

    const [data, setData] = useState<Sheet[]>([])

    const searchSheets = useCallback(async (page: number = 1) => {
        const result = await axiosInterface.get("/sheet", {
            params: {
                q: searchQuery,
                padding: (page - 1) * listParam.perPage,
                limit: listParam.perPage,
                statuses: searchFilters.join(","),
            },
        });

        console.log(result.data);

        setListParam((prev: ListParam) => ({
            ...prev,
            total: result.data.total,
            currentPage: page,
        }));
        setData(result.data.results);
    }, [searchQuery, searchFilters, listParam.perPage])

    useEffect(() => {
        searchSheets(1);
    }, [searchFilters, searchQuery, searchSheets])

    const loadPage = useCallback(async (page: number) => {
        const result = await axiosInterface.get("/sheet", {
            params: {
                q: searchQuery,
                padding: (page - 1) * listParam.perPage,
                limit: listParam.perPage,
                statuses: searchFilters.join(","),
            },
        });

        setListParam((prev: ListParam) => ({
            ...prev,
            total: result.data.total,
            currentPage: page,
        }));
        setData(result.data.results);
    }, [searchQuery, searchFilters, listParam.perPage]);

   useEffect(() => {
        if (lastChange) {
            // Zakłada się, że chcemy załadować stronę 1 przy każdej zmianie lastChange
            loadPage(1);
        }
    }, [lastChange, loadPage, listParam.currentPage]);

    // Function to generate pagination items with ellipsis
    const generatePaginationItems = () => {
        const totalPages = Math.ceil(listParam.total / listParam.perPage);
        const currentPage = listParam.currentPage;
        const items = [];

        // Always show first page
        items.push(
            <PaginationItem key={1}>
                <PaginationLink
                    href="#"
                    isActive={currentPage === 1}
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        if (currentPage !== 1) loadPage(1);
                    }}
                >
                    1
                </PaginationLink>
            </PaginationItem>
        );

        // Calculate start and end pages to show
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);

        // Add ellipsis after first page if needed
        if (startPage > 2) {
            items.push(
                <PaginationItem key="ellipsis-start">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        // Add middle pages
        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        href="#"
                        isActive={currentPage === i}
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage !== i) loadPage(i);
                        }}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        // Add ellipsis before last page if needed
        if (endPage < totalPages - 1) {
            items.push(
                <PaginationItem key="ellipsis-end">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        // Always show last page if there is more than one page
        if (totalPages > 1) {
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        href="#"
                        isActive={currentPage === totalPages}
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage !== totalPages) loadPage(totalPages);
                        }}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    }

    return (
        <div className="container mx-auto mt-5">
            <nav className="flex items-center gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Szukaj..."
                    className="border rounded px-3 py-2 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-4">
                    <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-green-600 has-[[aria-checked=true]]:bg-green-50 dark:has-[[aria-checked=true]]:border-green-900 dark:has-[[aria-checked=true]]:bg-green-950">
                        <Checkbox
                            id="toggle-2"
                            onClick={() => {
                                if (searchFilters.includes("open")) {
                                    setSearchFilters(prev => [...prev.filter((filter) => filter !== "open")]);
                                } else {
                                    setSearchFilters(prev => [...prev, "open"]);
                                }
                            }}
                            checked={searchFilters.includes("open")}
                            className="data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white dark:data-[state=checked]:border-green-700 dark:data-[state=checked]:bg-green-700"
                        />
                        <div className="grid gap-1.5 font-normal">
                            <p className="text-sm leading-none font-medium">
                                Otwarty
                            </p>
                        </div>
                    </Label>
                    <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-yellow-500 has-[[aria-checked=true]]:bg-yellow-50 dark:has-[[aria-checked=true]]:border-yellow-900 dark:has-[[aria-checked=true]]:bg-yellow-950">
                        <Checkbox
                            id="toggle-3"
                            checked={searchFilters.includes("toBeApproved")}
                            onClick={() => {
                                if (searchFilters.includes("toBeApproved")) {
                                    setSearchFilters(prev => [...prev.filter((filter) => filter !== "toBeApproved")]);
                                } else {
                                    setSearchFilters(prev => [...prev, "toBeApproved"]);
                                }
                            }}
                            className="data-[state=checked]:border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-white dark:data-[state=checked]:border-yellow-700 dark:data-[state=checked]:bg-yellow-700"
                        />
                        <div className="grid gap-1.5 font-normal">
                            <p className="text-sm leading-none font-medium">
                                Do zatwierdzwenia
                            </p>
                        </div>
                    </Label>
                    <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-black has-[[aria-checked=true]]:bg-black/10 dark:has-[[aria-checked=true]]:border-black dark:has-[[aria-checked=true]]:bg-black/30">
                        <Checkbox
                            id="toggle-4"
                            checked={searchFilters.includes("finished")}
                            onClick={() => {
                                if (searchFilters.includes("finished")) {
                                    setSearchFilters(prev => [...prev.filter((filter) => filter !== "finished")]);
                                } else {
                                    setSearchFilters(prev => [...prev, "finished"]);
                                }
                            }}
                            className="data-[state=checked]:border-black data-[state=checked]:bg-black data-[state=checked]:text-white dark:data-[state=checked]:border-black dark:data-[state=checked]:bg-black"
                        />
                        <div className="grid gap-1.5 font-normal">
                            <p className="text-sm leading-none font-medium">
                                Zatwierdzony
                            </p>
                        </div>
                    </Label>
                </div>
            </nav>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16">ID</TableHead>
                        <TableHead className="w-fdull smax-w-none">Nazwa</TableHead>
                        <TableHead className="w-40">Status</TableHead>
                        <TableHead className="w-40">Statyczny</TableHead>
                        <TableHead className="w-40">Ostateczny</TableHead>
                        <TableHead className="w-40">Liczenie głowne</TableHead>
                        <TableHead className="w-56">Data utworzenia</TableHead>
                        <TableHead className="w-24"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((el, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell>{el.id}</TableCell>
                            <TableCell>{el.name}</TableCell>
                            <TableCell>
                                {el.removed_at ? (
                                    <Badge className="bg-red-500 text-white">Usunięty</Badge>
                                ) : el.closed_at && el.signing_at ? (
                                    <Badge className="bg-black text-white">Zatwierdzony</Badge>
                                ) : el.closed_at && !el.signing_at ? (
                                    <Badge className="bg-yellow-500 text-white">Do zatwierdzenia</Badge>
                                ) : !el.closed_at ? (
                                    <Badge className="bg-green-600 text-white">Otwarty</Badge>
                                ) : null}
                            </TableCell>
                            <TableCell>
                                <Badge className={!el.dynamic ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                                    {!el.dynamic ? "Tak" : "Nie"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className={!el.temp ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                                    {!el.temp ? "Tak" : "Nie"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className={el.mainCount ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                                    {el.mainCount ? "Tak" : "Nie"}
                                </Badge>
                            </TableCell>
                            <TableCell>{el.created_at ? new Date(el.created_at).toLocaleString() : ""}</TableCell>
                            <TableCell>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openModal(el.id)}
                                >
                                    Szczegóły
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {listParam.total > listParam.perPage && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    if (listParam.currentPage > 1) {
                                        loadPage(listParam.currentPage - 1);
                                    }
                                }}
                                aria-disabled={listParam.currentPage === 1}
                                className={listParam.currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                        {generatePaginationItems()}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    const totalPages = Math.ceil(listParam.total / listParam.perPage);
                                    if (listParam.currentPage < totalPages) {
                                        loadPage(listParam.currentPage + 1);
                                    }
                                }}
                                aria-disabled={listParam.currentPage === Math.ceil(listParam.total / listParam.perPage)}
                                className={listParam.currentPage === Math.ceil(listParam.total / listParam.perPage) ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}

export default ArkuszPage