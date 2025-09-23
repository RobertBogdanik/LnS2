"use client";

import { useSearchModalStore } from "@/context/search";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useCallback, useEffect, useState } from "react";
import axiosInterface from "@/config/axios";
import { Button } from "../ui/button";
import { useProductCardStore } from "@/context/productCard";

// Use the provided `useDebounce` hook
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

const SearchModal = () => {
    interface Product {
        TowId: number;
        ItemName: string;
        MainCode: string;
    }
    const { isSearchOpen, searchQuery, setSearchQuery, closeSearchModal } = useSearchModalStore();
    const { openProductCard } = useProductCardStore();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<Product[]>([]);

    // Use debounce hook to get the debounced value for searchQuery
    const debouncedSearchQuery = useDebounce(searchQuery, 500); // debounce with 500ms delay

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await axiosInterface.get('/products/search', {
                params: {
                    q: query,
                    status: 'all',
                    padding: 0,
                    limit: 200,
                }
            });
            if (res.data.data.length === 1) {
                closeSearchModal();
                openProductCard(res.data.data[0].TowId);
                return;
            }
            setResults(res.data.data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [closeSearchModal, openProductCard]);

    useEffect(() => {
        if (debouncedSearchQuery) {
            handleSearch(debouncedSearchQuery);
        }
    }, [debouncedSearchQuery, handleSearch]); // Trigger search when debounced value changes

    return (
        <Dialog open={isSearchOpen} onOpenChange={closeSearchModal}>
            <DialogContent className="sm:max-w-[1200px] overflow-y-auto max-h-[80vh] p-0 gap-0">
                <DialogHeader className="sticky top-0 p-3 z-10 bg-white dark:bg-gray-900 pb-0">
                    <DialogTitle>Szukaj</DialogTitle>

                    <input
                        type="text"
                        placeholder="Szukaj produktów..."
                        className="w-full border p-2 rounded mb-4"
                        onChange={(e) => setSearchQuery(e.target.value)} // Set search query on change
                        autoFocus
                        value={searchQuery}
                    />
                </DialogHeader>
                <div className="p-3 pt-0">
                    {isLoading ? (
                        <p>Ładowanie...</p>
                    ) : (
                        <div className="flex justify-between items-start gap-4">
                            <ul className="flex-1">
                                {results.map((item) => (
                                    <li key={item.TowId} className="border-b py-2 flex items-center justify-between">
                                        <span>
                                            {item.ItemName} <strong>{item.MainCode}</strong>
                                        </span>
                                        <Button onClick={() => {
                                            closeSearchModal();
                                            openProductCard(item.TowId);
                                        }}>
                                            Karta produktu
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SearchModal;
