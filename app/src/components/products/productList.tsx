"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// import { Check, ChevronsUpDown } from "lucide-react";
import { MdClose } from "react-icons/md";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductListStore } from "@/context/productList";
import { useUserStore } from "@/context/user";
import { useProductCardStore } from "@/context/productCard";
import axiosInterface from "@/config/axios";

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


type Product = {
  TowId: number;
  ItemName: string;
  AsoName: string;
  ProductIsActive: number | boolean;
  SheetCreatedAt: string | null;
  SheetClosedAt: string | null;
  SheetSigningAt: string | null;
  SheetCreatedBy?: number;
  MainCode?: string;
  ExtraCodes?: string;
  StockQty?: number;
};
export function ProductListDialog({ onClose }: { onClose: (el: Product[]) => void }) {
  const { UsID } = useUserStore();
  const { isOpen, closeModal } = useProductListStore();
  const { openProductCard, isProductCardOpen } = useProductCardStore();


  const [products, setProducts] = useState<Product[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const debouncedValue = useDebounce(searchInput, 300);

  const [loadedCount, setLoadedCount] = useState({
    page: 0,
    perPage: 200,
    total: 0
  });
  const [searchParams, setSearchParams] = useState<{
    asortyment: string | null;
    status: string;
  }>({
    asortyment: null,
    status: "todo"
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [aso, setAso] = useState<string[]>([]);
  const [isAsortymentOpen, setIsAsortymentOpen] = useState(false);
  const inputsRefs = useRef<(HTMLInputElement | null)[]>([]);
  const asoInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    axiosInterface.get('/products/asos').then(res => {
      setAso(res.data);
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const res = await axiosInterface.get('/products/search', {
      params: {
        q: debouncedValue,
        aso: searchParams.asortyment,
        status: searchParams.status,
        padding: 0,
        limit: 200,
      }
    });

    try {
      setLoadedCount(prev => ({
        ...prev,
        total: res.data.total
      }));
      setProducts(res.data.data.map((el: Product) => ({ ...el, color: 'bg-red-500' })));
    } catch (error) {
      console.error("Błąd pobierania produktów:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, debouncedValue]);

  useEffect(() => {
    if (!isOpen) return;
    fetchProducts();
  }, [searchParams, debouncedValue, isOpen, fetchProducts]);

  useEffect(() => {
    if (isOpen) setSelectedProducts([])
  }, [isOpen])

  const toggleProduct = useCallback((TowId: number) => {
    setSelectedProducts((prev: number[] = []) => {
      if (prev.includes(TowId)) {
        return prev.filter(id => id !== TowId);
      } else {
        return [...prev, TowId];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedProducts((prev: number[] = []) => {
      const selectable = products.filter(
        p =>
          p.ProductIsActive === 1 &&
          p.SheetCreatedAt === null &&
          p.SheetClosedAt === null &&
          p.SheetSigningAt === null
      );
      const updated = [...prev];
      selectable.forEach(p => {
        if (!updated.includes(p.TowId)) {
          updated.push(p.TowId);
        }
      });
      return updated;
    });
  }, [products]);

  const deselectAll = useCallback(() => {
    setSelectedProducts((prev: number[] = []) => {
      return prev.filter((id: number) => !products.some(prod => prod.TowId === id));
    });
  }, [products]);

  const openProductCardSys = useCallback(() => {
    openProductCard(products[selectedIndex]?.TowId);
  }, [openProductCard, products, selectedIndex]);

  const saveModal = useCallback(() => {
    onClose(products.filter(p => selectedProducts.includes(p.TowId)));
    closeModal();
  }, [onClose, selectedProducts, closeModal, products]);

  const cancelModal = () => {
    closeModal();
  }


  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (!isOpen) return;
    if (isProductCardOpen) return;

    const inputEl = inputsRefs.current[0];
    const asoInputEl = asoInputRef.current;
    const activeEl = document.activeElement as HTMLElement;

    const isAsortymentInputActive = activeEl === asoInputEl;

    if (isAsortymentInputActive) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        return;
      }
      return;
    }

    const isMainInputActive = activeEl === inputEl;
    if (isMainInputActive && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      inputEl.blur();
      return;
    }

    if ((event.key === "ArrowUp" || event.key === "ArrowDown") && !isMainInputActive && !isAsortymentInputActive) {
      event.preventDefault();

      const newIndex = event.key === "ArrowUp"
        ? Math.max(0, selectedIndex - 1)
        : Math.min(products.length - 1, selectedIndex + 1);

      setSelectedIndex(newIndex);

      const selectedRow = document.getElementById(`product-${products[newIndex].TowId}`)
      const tableBody = document.querySelector('#product-list-table-body div');
      if (!selectedRow || !tableBody) return;

      const tdElement = tableBody.querySelector("td");

      const visiableFrom = tableBody.scrollTop
      const rowHeight = tdElement ? tdElement.clientHeight + 1 : 150;
      const visiableTo = tableBody.clientHeight + visiableFrom - rowHeight
      const topPos = selectedRow.offsetTop;

      if (event.key === "ArrowUp" && topPos - rowHeight < visiableFrom) {
        tableBody.scrollTop = topPos - rowHeight;
      }

      if (event.key === "ArrowDown" && topPos + rowHeight / 4 > visiableTo) {
        tableBody.scrollTop = visiableFrom + rowHeight;
      }

      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "v") {
      event.preventDefault();
      try {
        const text = await navigator.clipboard.readText();
        if (inputEl && !isAsortymentInputActive) {
          inputEl.focus();
          inputEl.value = text;
          setSearchInput(text);
          setTimeout(() => inputEl.blur(), 0);
        }
      } catch (err) {
        console.error("Błąd odczytu schowka:", err);
        alert("Błąd odczytu schowka");
      }
      return;
    }

    if (event.code === "Space" && !document.activeElement?.matches("input, textarea")) {
      event.preventDefault();
      console.log('space')
      const product = products[selectedIndex];
      if (product) toggleProduct(product.TowId);
      return;
    }

    if (event.key === "Insert") {
      event.preventDefault();
      selectAll()
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      deselectAll()
      return;
    }

    if (event.key === "F2") {
      event.preventDefault();
      saveModal()
      return;
    }

    if (event.key === "Enter" && activeEl === inputEl) {
      event.preventDefault();
      inputEl.blur();
      return;
    }


    if (event.key === "F7") {
      event.preventDefault();
      openProductCardSys()
      return;
    }

    if (activeEl === inputEl && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      return;
    }

    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      activeEl !== inputEl &&
      !isAsortymentInputActive &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      event.preventDefault();
      if (inputEl) {
        inputEl.focus();
        inputEl.value = event.key;
        setSearchInput(event.key);
      }
      return;
    }
  }, [
    selectedIndex,
    // selectedProducts,
    products,
    toggleProduct,
    // onClose,
    // closeModal,
    // openProductCard,
    deselectAll,
    openProductCardSys,
    saveModal,
    selectAll,
    isOpen,
    isProductCardOpen
  ]);


  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const getProductBG = useCallback((product: Product) => {
    if (product.SheetSigningAt !== null) return "bg-black text-white hover:bg-black";
    if (product.SheetClosedAt !== null) {
      return product.SheetCreatedBy === UsID
        ? "bg-yellow-300 hover:bg-yellow-400"
        : "bg-orange-500 hover:bg-orange-600";
    }
    if (product.SheetCreatedAt !== null) {
      return product.SheetCreatedBy === UsID
        ? "bg-lime-400 hover:bg-lime-500"
        : "bg-green-500 hover:bg-green-600";
    }
    if (product.ProductIsActive === 0) return "bg-red-500 hover:bg-red-600";
    return "";
  }, [UsID]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={closeModal}>
        <DialogContent className="min-w-7xl h-[90vh] flex flex-col gap-0 p-0" showCloseButton={false}>
          <DialogHeader className="gap-0 p-2">
            <div className="flex justify-between items-center w-full px-2">
              <DialogTitle className="text-lg font-semibold">
                Lista produktów
                {' '}
                {!isLoading && (
                  <span>
                    - {loadedCount.total} pasujących
                  </span>
                )}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Button variant="default" onClick={closeModal}>
                  <MdClose />
                </Button>
              </div>
            </div>
            <DialogDescription asChild>
              <div className="flex flex-wrap gap-2 items-center px-2 pb-1 w-full border-b">
                <div className="flex-grow basis-0 min-w-[150px] grid w-full items-center gap-1">
                  <Label className="text-sm">Nazwa/kod</Label>
                  <Input
                    type="text"
                    placeholder="Szukaj po nazwie, kodzie..."
                    className="flex-grow basis-0 min-w-[200px] p-3 border rounded"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    ref={(el) => { inputsRefs.current[0] = el; }}
                  />
                </div>

                <div className="flex-grow basis-0 min-w-[150px] max-w-[250px] grid w-full items-center gap-1">
                  <Label>Asortyment</Label>
                  <Popover open={isAsortymentOpen} onOpenChange={setIsAsortymentOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-[250px] justify-between"
                      >
                        {searchParams.asortyment || "<<Wszystkie asortymenty>>"}
                        {/* <ChevronsUpDown className="opacity-50" /> */}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Filtruj asortymenty..."
                          className="h-9"
                          ref={asoInputRef}
                        />
                        <CommandList>
                          <CommandEmpty>Brak asortymentów.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              key="all"
                              value=""
                              onSelect={() => setSearchParams(prev => ({ ...prev, asortyment: null }))}
                            >
                              {'<<Wszystkie asortymenty>>'}
                              <Checkbox className={cn("ml-auto", !searchParams.asortyment ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                            {aso.map((item) => (
                              <CommandItem
                                key={item}
                                value={item}
                                onSelect={() => setSearchParams(prev => ({ ...prev, asortyment: item }))}
                              >
                                {item}
                                <Checkbox className={cn("ml-auto", searchParams.asortyment === item ? "opacity-100" : "opacity-0")} />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid w-min max-w-sm items-center gap-1">
                  <Label>Status</Label>
                  <Select
                    value={searchParams.status}
                    onValueChange={(value) => setSearchParams(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Aktywne" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Globalne</SelectLabel>
                        <SelectItem value="all">Wszystkie</SelectItem>
                        <SelectItem value="todo">Do zrobienia</SelectItem>
                        <SelectItem value="done">Zrobione</SelectItem>
                        <SelectItem value="active">Aktywne</SelectItem>
                        <SelectItem value="deleted">Usunięte</SelectItem>
                        <SelectLabel>Moje</SelectLabel>
                        <SelectItem value="inprogress">W trakcie</SelectItem>
                        <SelectItem value="pending">Do zatwierdzenia</SelectItem>
                        <SelectItem value="mydone">Zrobione</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-full flex-col overflow-hidden px-2" id="product-list-table-body">

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px]">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Ładowanie produktów...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-white">
                    <TableRow className="border-b bg-gray-50">
                      <TableHead>
                        {/* <Checkbox
                          aria-label="Zaznacz wszystkie"
                        checked={
                          filteredProducts.length > 0 &&
                          filteredProducts.every((p) => selectedProducts.has(p.TowId))
                        }
                        onCheckedChange={handleSelectAll}
                        /> */}
                      </TableHead>
                      <TableHead>Nazwa</TableHead>
                      <TableHead>Ilość</TableHead>
                      <TableHead>Asortyment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="scrollable-table-container overflow-auto flex-1" /*ref={tableContainerRef}*/>
                    {products.map((item, index) => {
                      return (
                        <TableRow
                          key={item.TowId}
                          id={`product-${item.TowId}`}
                          className={cn(
                            getProductBG(item),
                            selectedIndex === index && "ring-2 ring-blue-500 bg-blue-100 ring-inset",
                          )}
                          onClick={() => setSelectedIndex(index)}
                        >
                          <TableCell>
                            <Checkbox
                              aria-label={`Zaznacz produkt ${item.ItemName}`}
                              checked={selectedProducts.includes(item.TowId)}
                              disabled={item.SheetCreatedAt !== null || item.ProductIsActive === false}
                              onCheckedChange={() => toggleProduct(item.TowId)}
                            />
                          </TableCell>
                          <TableCell>{item.ItemName}</TableCell>
                          <TableCell>{item.StockQty}</TableCell>
                          <TableCell>{item.AsoName}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className="text-sm mb-2 px-2 mt-2 flex justify-between items-center">
                </div>
              </>
            )}
          </div>

          <DialogFooter className="h-12 border-t bg-gray-100 dark:bg-zinc-900 text-sm rounded-b-2xl text-zinc-800 dark:text-zinc-200 px-6 p-2 flex items-center w-full">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-1 gap-y-1 w-full overflow-x-auto">
              <div
                onClick={saveModal}
                className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <span className="font-bold whitespace-nowrap">F2</span>
                <span>Na dokument</span>
              </div>
              <span className="mx-1 text-zinc-400 select-none pointer-events-none">|</span>
              <div
                onClick={cancelModal}
                className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
                <span className="font-bold whitespace-nowrap">Esc</span>
                <span>Anuluj</span>
              </div>
              <span className="mx-1 text-zinc-400 select-none pointer-events-none">|</span>
              <div
                className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                onClick={selectAll}
              >
                <span className="font-bold whitespace-nowrap">Ins</span>
                <span>Zaznacz wszystko</span>
              </div>
              <span className="mx-1 text-zinc-400 select-none pointer-events-none">|</span>
              <div
                className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                onClick={deselectAll}
              >
                <span className="font-bold whitespace-nowrap">Del</span>
                <span>Odznacz wszystko</span>
              </div>
              <span className="mx-1 text-zinc-400 select-none pointer-events-none">|</span>
              <div
                onClick={openProductCardSys}
                className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <span className="font-bold whitespace-nowrap">F7, Enter</span>
                <span>Szczegóły</span>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}