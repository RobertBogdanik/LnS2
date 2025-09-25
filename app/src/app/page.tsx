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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { useUserStore } from "@/context/user";
import jwt from 'jsonwebtoken';
import { useCountStore } from "@/context/count";
import axios from "axios";

interface Count {
  id: number;
  is_active: boolean;
  closed_at: string | null;
  name: string;
  open_at: string;
}

export default function LoginForm() {
  const { setUser } = useUserStore();
  const { setCount } = useCountStore();

  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loginProgress, setLoginProgress] = useState({
    step: 0,
    val: {
      username: "",
      count: "",
    }
  });

  const [availableCounts, setAvailableCounts] = useState<Count[]>([]);
  const [selectedCountId, setSelectedCountId] = useState<number | null>(null);
  const [showCountSelection, setShowCountSelection] = useState(false);

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginProgress({
      step: 1,
      val: {
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
        step: 0,
        val: {
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
      counts: Count[];
    } = loginResponse.data;

    setLoginProgress({
      step: 2,
      val: {
        username: user,
        count: "",
      }
    });

    if (!counts || counts.length === 0) {
      setLoginProgress({
        step: 0,
        val: {
          username: "",
          count: "",
        }
      });
      toast.error("Brak dostępnych liczeń. Skontaktuj się z administratorem.");
      return;
    }

    const activeCounts = counts.filter((c) => c.is_active && (!c.closed_at || new Date(c.closed_at) > new Date()));

    if (activeCounts.length === 1) {
      const selectedCount = activeCounts[0];
      completeLogin(token, user, selectedCount);
    }

    else if (activeCounts.length > 1) {
      sessionStorage.setItem("jwt", token);
      setAvailableCounts(activeCounts);
      setSelectedCountId(activeCounts[0].id);
      setShowCountSelection(true);
      setLoginProgress({
        step: 3,
        val: {
          username: user,
          count: "",
        }
      });
    }
    else {
      const selectedCount = counts.reduce((latest: Count, curr: Count) =>
        new Date(curr.closed_at ?? "") > new Date(latest.closed_at ?? "") ? curr : latest,
        counts[0]
      );
      completeLogin(token, user, selectedCount);
    }
  };

  const completeLogin = (token: string, user: string, selectedCount: Count) => {
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

    setLoginProgress({
      step: 4,
      val: {
        username: user,
        count: selectedCount.name,
      }
    });

    interface JwtData {
      userName: string;
      isAdmin: boolean;
      usid: number;
      defaultPiku: string;
    }

    const userdata = jwt.decode(token) as JwtData | undefined | null;
    if (userdata) {
      console.log("Userdata:", userdata);
      setUser(userdata.usid, userdata.userName, userdata.isAdmin, userdata.defaultPiku || 'A');
      router.push("/v2");
    } else {
      toast.error("Nie można odczytać danych użytkownika z tokenu.");
    }
  };

  const handleCountSelection = () => {
    if (!selectedCountId) {
      toast.error("Proszę wybrać liczenie");
      return;
    }

    const selectedCount = availableCounts.find(c => c.id === selectedCountId);
    if (selectedCount) {
      setShowCountSelection(false);
      const token = sessionStorage.getItem("jwt") || "";
      const username = loginProgress.val.username;
      completeLogin(token, username, selectedCount);
    }
  };

  useEffect(() => {
    if (!(localStorage.getItem("workstation") && localStorage.getItem("printer"))) {
      redirect('/config');
    }
  }, []);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <AlertDialog open={loginProgress.step > 0 && !showCountSelection}>
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

      <Dialog open={showCountSelection} onOpenChange={setShowCountSelection}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Wybierz liczenie</DialogTitle>
            <DialogDescription>
              Znaleziono kilka aktywnych liczeń. Wybierz które chcesz użyć.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">

            <Label htmlFor="count-select" className="mb-2 block font-medium">
              Wybierz liczenie:
            </Label>
            <select
              id="count-select"
              className="w-full border rounded px-3 py-2"
              value={selectedCountId ?? ""}
              onChange={(e) => setSelectedCountId(Number(e.target.value))}
            >
              {availableCounts.map((count: Count) => (
                <option key={count.id} value={count.id}>
                  {count.name} (Otwarte: {new Date(count.open_at).toLocaleString()}
                  {count.closed_at ? ` | Zamknięte: ${new Date(count.closed_at).toLocaleString()}` : ""})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCountSelection(false)}>
              Anuluj
            </Button>
            <Button onClick={handleCountSelection}>
              Wybierz
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                      autoFocus
                    >
                        <InputOTPGroup className="w-full border ">
                        {Array.from({ length: 13 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} className="w-full aspect-square border border-gray-800" />
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
