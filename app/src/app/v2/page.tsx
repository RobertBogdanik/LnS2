'use client'

import React, { useCallback, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useProductListStore } from "@/context/productList"
import axiosInterface from "@/config/axios"
import { ProductListDialog } from "@/components/products/productList"
import { FcCellPhone } from "react-icons/fc";
import CreateSheet from "@/components/createsheet/createSheet"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CiLock, CiUnlock } from "react-icons/ci"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { IoMdDownload } from "react-icons/io"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"
import { useUserStore } from "@/context/user"



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

export default function ProductTable() {

  const [selctedPiku, setSelectedPiku] = React.useState<string>('A');
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  type DynamicCount = {
    page: number;
    aviable: {
      [key: string]: boolean;
    };
    conditions: boolean;
    selected: string | null;
    loading: boolean;
    created: {
      sheet: { name: string };
      print: { status: boolean; printer: string };
      filePath?: string;
    } | null;
  };

  const [dynamicCount, setDynamicCount] = React.useState<DynamicCount>({
    page: 0,
    aviable: {
      A: false,
      B: false,
      C: false,
      D: false,
      E: false,
      F: false,
      G: false
    },
    conditions: false,
    selected: null,
    loading: true,
    created: null
  });
  const {
    isOpen,
    openModal,
  } = useProductListStore();

  const {
    defaultPiku,
  } = useUserStore();

  useEffect(() => {
    setSelectedPiku(defaultPiku.trim());
  }, [defaultPiku])

  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const deleteSelectedProduct = React.useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < products.length) {
      setProducts(products => products.filter((_, idx) => idx !== selectedIndex));
    }
  }, [selectedIndex, products.length]);

  const handleDocumentKeyDown = useCallback((event: KeyboardEvent) => {
    if (!openCreateModal && !isOpen) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => prev === 0 ? -1 : prev === -1 ? products.length - 1 : Math.max(prev - 1, 0));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < products.length ? prev + 1 : -1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        openModal();
      } else if (event.key === "F2") {
        event.preventDefault();
        saveSheet();
      } else if (event.key === "F12") {
        event.preventDefault();
        createDynamicSheet();
      } else if (event.key === "Delete") {
        event.preventDefault();
        deleteSelectedProduct();
      }
    }
  }, [products.length, isOpen, openCreateModal, deleteSelectedProduct, openModal]);

  useEffect(() => {
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [products.length, handleDocumentKeyDown, isOpen, openCreateModal]);

  const addSelectedProducts = (newProducts: Product[]) => {
    setProducts(prev =>
      [
        ...prev,
        ...newProducts.filter(
          np => !prev.some(p => p.TowId === np.TowId)
        )
      ]
    );
  };

  const saveSheet = () => {
    setOpenCreateModal(true);
  };

  const createDynamicSheet = async () => {
    const aviable = {
      A: false,
      B: false,
      C: false,
      D: false,
      E: false,
      F: false,
      G: false
    }

    setDynamicCount({
      page: 1,
      aviable: aviable,
      conditions: false,
      selected: null as string | null,
      loading: true,
      created: null
    })

    const dynamicPiku = await axiosInterface.get('sheet/dynamicPiku')

    if (dynamicPiku.data && typeof dynamicPiku.data === "object") {
      Object.keys(dynamicPiku.data).forEach(key => {
        if (key in aviable) {
          aviable[key as keyof typeof aviable] = !!dynamicPiku.data[key];
        }
      });
    }

    setDynamicCount({
      page: 2,
      aviable: aviable,
      conditions: false,
      selected: null as string | null,
      loading: false,
      created: null
    })
  };

  const saveDynamicSheet = async () => {
    const response = await axiosInterface.post('sheet/dynamic', {
      piku: dynamicCount.selected
    });

    setDynamicCount({ ...dynamicCount, page: 3, created: response.data });

  };

  const addNewPosition = () => {
    openModal();
  };


  const closeCreateSheet = () => {
    setOpenCreateModal(false);
    setProducts([]);
  };

  return (
    <>
      <main className="flex-1 p-6">
        <ProductListDialog onClose={addSelectedProducts} />
        <CreateSheet isOpen={openCreateModal} onClose={closeCreateSheet} list={products.map(p => p.TowId)} piku={selctedPiku} />

        <AlertDialog open={dynamicCount.page > 0} onOpenChange={open => setDynamicCount({ ...dynamicCount, page: open ? dynamicCount.page : 0 })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tworzenie dynamicznego liczenia</AlertDialogTitle>
              <AlertDialogDescription>
                {dynamicCount.page === 1 && <>Ładowanie dostępnych pikaczy...</>}
                {dynamicCount.page === 2 && <>
                  Wybierz pikacza, z którym chcesz powiązać liczenie dynamiczne.
                  <Select
                    value={dynamicCount.selected || ""}
                    onValueChange={value => setDynamicCount({ ...dynamicCount, selected: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz pikacza" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dynamicCount.aviable).map(([key, value]) => (
                        <SelectItem key={key} value={key} className={value ? "cursor-pointer" : "bg-red-300"} disabled={!value}>
                          {value ? <CiUnlock /> : <CiLock />}
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center gap-3 mt-3">
                    <Checkbox checked={!!dynamicCount.conditions} onCheckedChange={checked => setDynamicCount({ ...dynamicCount, conditions: !!checked })} id="terms" />
                    <Label htmlFor="terms">Akceptuję zasady liczenia dynamicznego</Label>
                  </span>
                </>}
                {dynamicCount.page === 3 && <>
                  Dynamiczne liczenie <strong>{dynamicCount.created?.sheet.name}</strong> zostalo utworzone pomyslnie.
                  {dynamicCount.created?.print.status && <span> Zlecony został wydruk na drukarce <strong>{dynamicCount.created?.print.printer}</strong>.</span>}
                  {!dynamicCount.created?.print.status && <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>Wydruk nie powiódł się.</AlertTitle>
                  </Alert>}
                  <br /><Button
                    variant={"link"}
                    onClick={() => {
                      if (dynamicCount.created?.filePath) {
                        window.open(`http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}/files/download?path=${encodeURIComponent(dynamicCount.created?.filePath)}`, '_blank');
                      }
                    }}
                  >
                    <IoMdDownload />
                    Pobierz PDF
                  </Button>
                </>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {dynamicCount.page === 2 && <AlertDialogCancel onClick={() => setDynamicCount({ ...dynamicCount, page: 0 })}>Rezygnuję</AlertDialogCancel>}
              {dynamicCount.page === 2 && <AlertDialogAction
                onClick={saveDynamicSheet}
                disabled={
                  !dynamicCount.selected ||
                  !dynamicCount.aviable[dynamicCount.selected as keyof typeof dynamicCount.aviable] ||
                  !dynamicCount.conditions
                }
              >Stwórz arkusz</AlertDialogAction>}
              {dynamicCount.page === 3 && <AlertDialogCancel className="w-full" onClick={() => setDynamicCount({ ...dynamicCount, page: 0 })}>Zamknij</AlertDialogCancel>}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Table className="max-w-screen">
          <TableHeader>
            <TableRow>
              <TableHead>TowId</TableHead>
              <TableHead>Nazwa</TableHead>
              <TableHead>Kody</TableHead>
              <TableHead>Ilość</TableHead>
              <TableHead>Asortyment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow
                key={index}
                className={index === selectedIndex ? "bg-gray-300 hover:bg-gray-300 border-dotted border-black" : ""}
                onClick={() => handleRowClick(index)}
              >
                <TableCell>{product.TowId}</TableCell>
                <TableCell>{product.ItemName}</TableCell>
                <TableCell>
                  <div>
                    <strong>{product.MainCode}</strong>
                    <br />
                    {product.ExtraCodes?.split(';').map((code: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {code.trim()}
                      </p>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{product.StockQty}</TableCell>
                <TableCell>{product.AsoName}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={5} className={`text-green-600 ${selectedIndex === -1 ? "bg-gray-300 hover:bg-gray-300 border-dotted border border-black" : ""}`}
                onDoubleClick={openModal}
                onClick={() => setSelectedIndex(-1)}>
                Nowa pozycja
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </main>

      <div style={{ height: "3rem" }} />
      <footer className="h-12 border-t bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 px-4 flex items-center w-full fixed bottom-0 left-0 z-50">
        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-1 gap-y-1 w-full overflow-x-auto">
          <Shortcut keys="F2" label="Zapisz" onClick={saveSheet} />
          <Separator />
          <Shortcut keys="F12" label="Stwórz dynamiczny" onClick={createDynamicSheet} />
          <Separator />
          <Shortcut keys="Enter" label="Dodaj" onClick={addNewPosition} />
          <Separator />
          <Shortcut keys="Del" label="Usuń z listy" onClick={deleteSelectedProduct} />
          <div className="ml-auto">
            <div className="flex gap-2">
              <FcCellPhone size={28} />
                {(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map(option => (
                <label
                  key={option}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md border cursor-pointer transition-colors ${
                  selctedPiku === option
                    ? "border-red-600 bg-grreday-100 font-bold text-red-600"
                    : "border-zinc-300 bg-white dark:bg-zinc-900"
                  }`}
                  style={{ outline: "none" }}
                >
                  <input
                  type="radio"
                  name="dynamic-piku"
                  value={option}
                  checked={selctedPiku === option}
                  onChange={() =>
                    setSelectedPiku(option)
                  }
                  className="accent-gray-500 hidden"
                  style={{ accentColor: "#3b82f6" }}
                  />
                  {option}
                </label>
                ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}


function Shortcut({ keys, label, onClick }: { keys: string; label: string; onClick?: () => void }) {
  return (
    <div className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors" onClick={onClick}>
      <span className="font-bold whitespace-nowrap">{keys}</span>
      <span>{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <span className="mx-1 text-zinc-400 select-none pointer-events-none">|</span>
  );
}

