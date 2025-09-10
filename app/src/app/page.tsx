"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import axiosInterface from "../config/axios";
import { redirect, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useUserStore } from "@/context/user";
import jwt from 'jsonwebtoken';
import { useCountStore } from "@/context/count";
import axios from "axios";

export default function LoginForm() {


  const {
    setUser
  } = useUserStore();

  const {
    setCount
  } = useCountStore();

  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loginProgress, setLoginProgress] = useState({
    step: 0, val: {
      username: "",
      count: "",
    }
  });

  // type StoreDefinition = {
  //   storeName: string;
  //   keyPath: string;
  //   data: any[];
  // };

  // const updateToIndexedDB = async (dbName: string, version: number, storeDefs: StoreDefinition[], count: number) => {
  //   const db = await openDB(dbName, version, {
  //     upgrade(db) {
  //       for (const { storeName, keyPath } of storeDefs) {
  //         if (!db.objectStoreNames.contains(storeName)) {
  //           db.createObjectStore(storeName, {
  //             keyPath,
  //             autoIncrement: false,
  //           });
  //         }
  //       }
  //     },
  //   });

  //   for (const { storeName, data } of storeDefs) {
  //     const tx = db.transaction(storeName, 'readwrite');
  //     const store = tx.objectStore(storeName);

  //     for (const item of data) {
  //       const existingItem = await store.get(item.TowId);
  //       if (existingItem) {
  //         console.log("Istnieje:", existingItem);
  //         console.log("Aktualizuję:", item);
  //         await store.put({
  //           ...existingItem, counts: {
  //             ...existingItem.counts,
  //             [count]: {
  //               ...item,
  //             },
  //           }
  //         });
  //       } else {
  //         toast.error(`Brak TowId: ${item.TowId} w bazie danych.`);
  //       }
  //     }

  //     await tx.done;
  //   }

  //   db.close();
  // };

  // const saveToIndexedDB = async (dbName: string, version: number, storeDefs: StoreDefinition[]) => {
  //   const db = await openDB(dbName, version, {
  //     upgrade(db) {
  //       for (const { storeName, keyPath } of storeDefs) {
  //         if (!db.objectStoreNames.contains(storeName)) {
  //           db.createObjectStore(storeName, {
  //             keyPath,
  //             autoIncrement: false,
  //           });
  //         }
  //       }
  //     },
  //   });

  //   for (const { storeName, data } of storeDefs) {
  //     const tx = db.transaction(storeName, 'readwrite');
  //     const store = tx.objectStore(storeName);

  //     for (const item of data) {
  //       await store.put(item);
  //     }

  //     await tx.done;
  //   }

  //   db.close();
  // };

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginProgress({
      step: 1, val: {
        username: "",
        count: "",
      }
    });

    const workstation = localStorage.getItem("workstation") || "";

    const lastSyncDate = localStorage.getItem("lastSyncs")
      ? new Date(localStorage.getItem("lastSyncs") as string)
      : new Date(1971, 0, 1);

    let loginResponse;
    try {
      loginResponse = await axiosInterface.post('/auth/login', {
        cardNumber: otp,
        workstation: workstation,
        lastUpdate: lastSyncDate,
      });
    } catch (err: unknown) {
      setLoginProgress({
        step: 0, val: {
          username: "",
          count: "",
        }
      });
      if (axios.isAxiosError(err)) {
        toast.error("Wystąpił błąd podczas logowania.", {
          description: (
            <ul className="list-disc list-inside">
              {(err.response?.data?.message || []).map((msg: string, idx: number) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          ),
        });
      }
      return;
    }

    const { token, user, counts }: {
      token: string;
      user: string;
      counts: Array<{
        id: number;
        is_active: boolean;
        closed_at: string | null;
        name: string;
        open_at: string;
      }>;
    } = loginResponse.data;
    setLoginProgress({
      step: 2, val: {
        username: user,
        count: "",
      }
    });

    if (!counts || counts.length === 0) {
      setLoginProgress({
        step: 0, val: {
          username: "",
          count: "",
        }
      });
      toast.error("Brak dostępnych liczeń. Skontaktuj się z administratorem.");
      return;
    }

    interface Count {
      id: number;
      is_active: boolean;
      closed_at: string | null;
      name: string;
      open_at: string;
    }

    const activeCount = (counts as Count[]).find((c) => c.is_active && !c.closed_at);
    const selectedCount = activeCount
      ? activeCount
      : counts.reduce((latest: Count, curr: Count) =>
        new Date(curr.closed_at ?? "") > new Date(latest.closed_at ?? "") ? curr : latest,
        counts[0]
      );

    sessionStorage.setItem("selectedCount", selectedCount.id.toString());
    setCount(
      selectedCount.closed_at,
      selectedCount.id,
      selectedCount.is_active,
      selectedCount.name,
      selectedCount.open_at
    );

    toast.success("Zalogowano pomyślnie!", {
      description: `Witaj ${user}!`,
    });

    sessionStorage.setItem("jwt", token);

    // // let syncResponse;
    // // console.log("Last sync date:", lastSyncDate);
    // // try {
    // //   syncResponse = await axiosInterface.get('/sync/by-timestamp', {
    // //     params: {
    // //       lastSyncs: lastSyncDate,
    // //     },
    // //   });
    // // } catch (err: any) {
    // //   setLoginProgress({
    // //     step: 0, val: {
    // //       username: "",
    // //       count: "",
    // //     }
    // //   });
    // //   toast.error("Wystąpił błąd podczas synchronizacji danych.", {
    // //     description: (
    // //       <ul className="list-disc list-inside">
    // //         {(err.response?.data?.message || []).map((msg: string, idx: number) => (
    // //           <li key={idx}>{msg}</li>
    // //         ))}
    // //       </ul>
    // //     ),
    // //   });
    // //   return;
    // // }

    // // const { lastZmiana, pc5MarketViews } = syncResponse.data;
    // // setLoginProgress(prev => ({ ...prev, step: 3 }));
    // // console.log("Last zmiana date:", lastZmiana);
    // // console.log("PC5MarketViews:", pc5MarketViews.length);

    // // await saveToIndexedDB('LnS', 1, [
    // //   {
    // //     storeName: 'pc5MarketInwentaryzator',
    // //     keyPath: 'TowId',
    // //     data: pc5MarketViews,
    // //   },
    // // ]);

    // if (pc5MarketViews.length !== 0) localStorage.setItem("lastSyncs", new Date(lastZmiana).toISOString());

    // toast.success("Dane zostały zsynchronizowane!", {
    //   description: `Zsynchronizowano ${pc5MarketViews.length} pozycji.`,
    // });

    setLoginProgress(prev => ({
      step: 4, val: {
        ...prev.val,
        count: selectedCount.name,
      }
    }));

    // const lastCountSync = localStorage.getItem(`last-${selectedCount.id}-sync`)
    //   ? new Date(localStorage.getItem(`last-${selectedCount.id}-sync`) as string)
    //   : new Date(1971, 0, 1);

    // try {
    //   const countSyncResponse = await axiosInterface.get('/sync/count/by-timestamp', {
    //     params: {
    //       lastSyncs: lastCountSync,
    //       countId: selectedCount.id,
    //     },
    //   });
    //   console.log("Count sync response:", countSyncResponse.data);

    //   const { lastSyncs: countLastSync, updates: countUpdatesViews } = countSyncResponse.data;
    //   updateToIndexedDB('LnS', 1, [{
    //     storeName: 'pc5MarketInwentaryzator',
    //     keyPath: 'TowId',
    //     data: countUpdatesViews,
    //   }], selectedCount.id);

    //   if (countUpdatesViews.length !== 0) {
    //     localStorage.setItem(`last-${selectedCount.id}-sync`, new Date(countLastSync).toISOString());
    //   }

    //   toast.success("Dane liczenia zostały zsynchronizowane!", {
    //     description: `Zsynchronizowano ${countUpdatesViews.length} pozycji liczenia.`,
    //   });
    // } catch (err: any) {
    //   setLoginProgress({
    //     step: 0, val: {
    //       username: "",
    //       count: "",
    //     }
    //   });
    //   toast.error("Wystąpił błąd podczas synchronizacji danych liczenia.", {
    //     description: (
    //       <ul className="list-disc list-inside">
    //         {(err.response?.data?.message || []).map((msg: string, idx: number) => (
    //           <li key={idx}>{msg}</li>
    //         ))}
    //       </ul>
    //     ),
    //   });
    //   return;
    // }

    interface JwtData {
      userName: string;
      isAdmin: boolean;
      usid: number;
    }

    const userdata = jwt.decode(token) as JwtData | undefined | null;
    if (userdata) {
      console.log("Userdata:", userdata);
      setUser(userdata.usid, userdata.userName, userdata.isAdmin);
      router.push("/v2");
    } else {
      toast.error("Nie można odczytać danych użytkownika z tokenu.");
    }

  };

  useEffect(() => {
    if (!(localStorage.getItem("workstation") && localStorage.getItem("printer"))) {
      redirect('/config');
    }
  }, []);


  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <AlertDialog open={loginProgress.step > 0}>
        --{process.env.NEXT_PUBLIC_SERVER_HOST}--
        <AlertDialogContent className="text-center">
          <div className="flex justify-center mt-3 h-5 space-x-2">
            <div className="w-3 h-5 rounded-full bg-primary animate-bounce"></div>
            <div className="w-3 h-5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-3 h-5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-medium text-center">
              {loginProgress.step === 1 && "Logowanie..."}
              {loginProgress.step === 2 && `Witaj, ${loginProgress.val.username}`}
              {loginProgress.step === 3 && `Witaj, ${loginProgress.val.username}`}
              {loginProgress.step === 4 && `Witaj, ${loginProgress.val.username}`}
            </AlertDialogTitle>
            {loginProgress.step === 2 && <AlertDialogDescription className="text-muted-foreground text-sm text-center">
              Pobieranie danych...
            </AlertDialogDescription>}
            {loginProgress.step === 3 && <AlertDialogDescription className="text-muted-foreground text-sm text-center">
              Synchronizacja danych...
            </AlertDialogDescription>}
            {loginProgress.step === 4 && <AlertDialogDescription className="text-muted-foreground text-sm text-center">
              Synchronizowanie liczenia <strong>{loginProgress.val.count}</strong>...
            </AlertDialogDescription>}
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent>
              <form className="p-6 md:p-8" onSubmit={login}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">LnS<sub>2</sub></h1>
                    <p className="text-muted-foreground text-balance">
                      Zaloguj się do swojego konta
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <InputOTP
                      maxLength={13}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      className="w-full"
                    >
                      <InputOTPGroup className="w-full">
                        {Array.from({ length: 13 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} className="w-full aspect-square" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button type="submit" className="m-auto w-min cursor-pointer">
                    Zaloguj
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-muted-foreground text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
            Klikając Zaloguj, akceptujesz {" "}
            <a href="#">Zasady liczenia</a> oraz zapoznałeś się z{" "}
            <a href="#">Instrukcją programu</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
