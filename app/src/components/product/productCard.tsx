import { useProductCardStore } from "@/context/productCard";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Button } from "../ui/button";
import { useCallback, useEffect, useState } from "react";
import axiosInterface from "@/config/axios";
import { useSheetCardStore } from "@/context/sheetCard";

const ProductCard = () => {
  const { isProductCardOpen, ProductCardTowID, closeProductCardModal } = useProductCardStore();
  const { isOpen, openModal } = useSheetCardStore();

  const [isLoading, setIsLoading] = useState(false);

  type ProductCardHistoryEntry = {
    when: string;
    who: string;
    where: string;
    what: string;
  };

  type ProductCardType = {
    basic?: {
      TowId: number;
      ItemName: string;
      MainCode: string;
      ExtraCodes: string;
    };
    quantity: {
      shelf: number;
      pcMarket: number;
      delta: number;
    };
    isImported: boolean;
    isInSheet: boolean;
    sheet?: {
      id: number;
      name: string;
      signing_at: string | null;
    };
    history: ProductCardHistoryEntry[];
  };

  const [productCard, setProductCard] = useState<ProductCardType>({
    quantity: {
      shelf: 0,
      pcMarket: 986.256,
      delta: -986.256
    },
    isImported: false,
    isInSheet: false,
    history: []
  });

  const openSheetCardModal = useCallback(() => {
    if (isOpen) return;
    const sheetId = productCard?.sheet?.id;
    if (sheetId) openModal(sheetId);
  }, [isOpen, openModal, productCard?.sheet?.id]);

  const [quantities, setQuantities] = useState<{
    shelf: string | number;
    pcMarket: string | number;
    delta: string | number;
  }>({
    shelf: 0,
    pcMarket: 986.256,
    delta: -986.256
  });

  const loadProduct = async (TowID: number) => {
    setIsLoading(true);
    try {
      const response = await axiosInterface.get(`/products/${TowID}`);
      console.log(response.data);
      setProductCard(response.data);
      if (response.data.isImported) {
        setQuantities({
          shelf: response.data.quantity.shelf,
          pcMarket: response.data.quantity.pcMarket,
          delta: response.data.quantity.delta,
        });
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const updateDelta = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    axiosInterface.put(`/products/${ProductCardTowID}`, { shelf: quantities.shelf })
      .then(response => {
        setProductCard(response.data);
        setQuantities(prev => ({ ...prev, shelf: quantities.shelf }));
      })
      .catch(error => {
        console.error("Error updating delta:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ProductCardTowID, quantities.shelf]);

  useEffect(() => {
    if (!isProductCardOpen) return;
    loadProduct(ProductCardTowID)
  }, [ProductCardTowID, isProductCardOpen])

  return (
    <Dialog open={isProductCardOpen} onOpenChange={closeProductCardModal}>
      <form>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Towar [{productCard?.basic?.TowId}]</DialogTitle>
          </DialogHeader>
          {isLoading && <div className="flex justify-center my-28 h-20 space-x-2">
            <div className="w-5 h-20 rounded-full bg-primary animate-bounce"></div>
            <div className="w-5 h-20 rounded-full bg-primary animate-bounce [animation-delay:0.1s]"></div>
            <div className="w-5 h-20 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-5 h-20 rounded-full bg-primary animate-bounce [animation-delay:0.3s]"></div>
            <div className="w-5 h-20 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
            <div className="w-5 h-20 rounded-full bg-primary animate-bounce [animation-delay:0.5s]"></div>
          </div>}
          {!isLoading && <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 flex items-center justify-center">
              <div
                className="w-[200px] h-[200px] object-cover bg-gray-200"
              />
            </div>
            <div className="col-span-2 gap-4 flex-col flex">
              <div>
                <Label>Nazwa</Label>
                <div>{productCard?.basic?.ItemName}</div>
              </div>
              <div>
                <Label>Kod(y)</Label>
                <div>
                  <strong>{productCard?.basic?.MainCode.replaceAll('?', '')}</strong>
                  {productCard?.basic?.ExtraCodes !== "" && ', '}
                  <span>{productCard?.basic?.ExtraCodes.split(";").map((el: string) => el.replaceAll('?', '')).join(", ")}</span>
                </div>
              </div>
              {productCard.isInSheet && <div>
                <Label>Arkusz</Label>
                <div>
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      type="text"
                      value={productCard?.sheet?.name}
                      disabled
                      className="w-full bg-gray-100 text-gray-800"
                    />
                    <Button variant="outline" type="button" onClick={openSheetCardModal} disabled={isOpen}>
                      ...
                    </Button>
                  </div>
                </div>
              </div>}
              {productCard.isImported && <div>
                <Label>Delta</Label>
                <div>
                  <Input type="number" className="w-full bg-gray-100 text-gray-800" value={productCard.quantity.delta} disabled />
                </div>
              </div>}
            </div>
            {(productCard.isImported && productCard?.sheet?.signing_at) && <div className="col-span-3 flex flex-col gap-2">
              <hr className="col-span-3" />
              <Label>Edycja ręczna</Label>
              <div>
                <div className="flex items-baseline gap-6">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      className={`w-30 ${Number(quantities.shelf) < 0 ? "border-red-600 bg-red-100" : ""}`}
                      value={quantities.shelf}
                      onFocus={(e) => {
                        e.target.select();
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replaceAll(",", ".");
                        const dotIndex = value.indexOf(".");
                        const sanitizedValue =
                          dotIndex === -1
                            ? value
                            : value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replaceAll(".", "");

                        const num = Number(sanitizedValue);

                        setQuantities(q => ({
                          ...q,
                          shelf: sanitizedValue ? sanitizedValue : 0,
                          delta: Number((num - productCard.quantity.pcMarket).toFixed(3))
                        }));
                      }}
                      onBlur={() => {
                        setQuantities(q => ({
                          ...q,
                          shelf: Number((Number(quantities.delta) + productCard.quantity.pcMarket).toFixed(3))
                        }));
                      }}
                    />
                    <Label className="whitespace-nowrap mt-1">Na półce</Label>
                  </div>
                  <span className="mx-2">-</span>
                  <div className="flex flex-col items-center">
                    <Input type="number" className="w-30" disabled value={quantities.pcMarket} />
                    <Label className="whitespace-nowrap mt-1">W PCmarket</Label>
                  </div>
                  <span className="mx-2">=</span>
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      className="w-30"
                      value={quantities.delta}
                      onFocus={(e) => {
                        e.target.select();
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replaceAll(",", ".");
                        const dotIndex = value.indexOf(".");
                        const sanitizedValue_temp =
                          dotIndex === -1
                            ? value
                            : value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replaceAll(".", "")
                        const sanitizedValue = sanitizedValue_temp.substring(sanitizedValue_temp.indexOf('-'));
                        const num = Number(sanitizedValue);

                        if (!isNaN(num)) {
                          setQuantities({
                            ...quantities,
                            delta: sanitizedValue ? sanitizedValue : 0,
                            shelf: Number((num + productCard.quantity.pcMarket).toFixed(3))
                          });
                        } else {
                          setQuantities({
                            ...quantities,
                            delta: sanitizedValue,
                            shelf: Number((productCard.quantity.pcMarket).toFixed(3))
                          });
                        }
                      }}
                      onBlur={() => {
                        setQuantities(q => ({
                          ...q,
                          delta: Number((Number(q.shelf) - productCard.quantity.pcMarket).toFixed(3))
                        }));
                      }}
                      step="any"
                    />
                    <Label className="whitespace-nowrap mt-1">Delta</Label>
                  </div>
                  <div className="flex flex-col items-baseline w-full">
                    <Button className="w-full" onClick={updateDelta} disabled={Number(quantities.shelf) < 0}>Zmień deltę</Button>
                  </div>
                </div>
              </div>
            </div>}
            {productCard.isInSheet && <div className="col-span-3 flex flex-col gap-2">
              <hr className="col-span-3" />
              <Label>Historia</Label>
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                <Table>
                  <TableBody>
                    {productCard?.history?.map((entry: ProductCardHistoryEntry, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(entry.when).toLocaleString()}</TableCell>
                        <TableCell>{entry.who}</TableCell>
                        <TableCell>{entry.where}</TableCell>
                        <TableCell>{entry.what}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>}
          </div>}
          <DialogFooter>
            {/* <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button> */}
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default ProductCard;