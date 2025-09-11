"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import axiosInterface from "@/config/axios";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";


const SettingsPage = () => {
    type User = {
        id: number;
        username: string;
        card: string;
        created_at: string;
        isAdmin: boolean;
    };
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState<{ username: string; card: string; isAdmin: boolean }>({ username: "", card: "", isAdmin: false });
    type Count = {
        id: number;
        name: string;
        open_at: string;
        final_at: string;
        closed_at: string;
    };
    const [counts, setCounts] = useState<Count[]>([]);
    const [newCount, setNewCount] = useState<{ name: string; open_at: string; final_at: string; closed_at: string }>({ name: "", open_at: "", final_at: "", closed_at: "" });

    const fetchData = async () => {
        axiosInterface.get('/settings/users').then(res => {
            setUsers(res.data);
        });
        axiosInterface.get('/settings/counts').then(res => {
            setCounts(res.data);
        });
    }

    useEffect(() => {
        fetchData();
    }, []);

    const createUser = useCallback(async () => {
        const res = await axiosInterface.post('/settings/user', newUser);
        if (res.status === 201) {
            toast.success("Użytkownik dodany");
            setNewUser({ username: "", card: "", isAdmin: false });
            fetchData();
        } else {
            toast.error("Błąd podczas dodawania użytkownika");
        }
    }, [newUser]);

    const createCount = useCallback(async () => {
        const res = await axiosInterface.post('/settings/count', newCount);
        if (res.status === 201) {
            toast.success("Licznik dodany");
            setNewCount({ name: "", open_at: "", final_at: "", closed_at: "" });
            fetchData();
        } else {
            toast.error("Błąd podczas dodawania licznika");
        }
    }, [newCount]);

    const updateUser = async (id: number) => {
        const user = users.find(u => u.id === id);
        if (!user) return;
        
        const res = await axiosInterface.put(`/settings/user/${id}`, user);
        if (res.status === 200) {
            toast.success("Użytkownik zaktualizowany");
            fetchData();
        } else {
            toast.error("Błąd podczas aktualizacji użytkownika");
        }
    }

    const updateCount = async (id: number) => {
        const count = counts.find(c => c.id === id);
        if (!count) return;
        
        const res = await axiosInterface.put(`/settings/count/${id}`, count);
        if (res.status === 200) {
            toast.success("Licznik zaktualizowany");
            fetchData();
        } else {
            toast.error("Błąd podczas aktualizacji licznika");
        }
    }

    const modifyUserField = (id: number, field: string, value: string|number|Date|boolean) => {
        setUsers(users.map(user => user.id === id ? { ...user, [field]: value } : user));
    }

    const modifyCountField = (id: number, field: string, value: string|number|Date|boolean) => {
        setCounts(counts.map(count => count.id === id ? { ...count, [field]: value } : count));
    }

    return <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Użytkownicy</h1>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Karta</TableHead>
                    <TableHead>Data stworzenia</TableHead>
                    <TableHead>Uprawnienia</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell className="font-medium">-</TableCell>
                    <TableCell>
                        <Input type="text" name="username" placeholder="Nazwa" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="border rounded px-2 py-1 w-full" />
                    </TableCell>
                    <TableCell>
                        <Input type="text" name="card" placeholder="Numer karty" value={newUser.card} onChange={(e) => setNewUser({ ...newUser, card: e.target.value })} className="border rounded px-2 py-1 w-full" />
                    </TableCell>
                    <TableCell>
                        <Input type="datetime-local" disabled className="border rounded px-2 py-1 w-full" />
                    </TableCell>
                    <TableCell>
                        <Select name="isAdmin" defaultValue="0" onValueChange={(value) => setNewUser({ ...newUser, isAdmin: value === "1" })}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Użytkownik" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectItem value="0">Użytkownik</SelectItem>
                                <SelectItem value="1">Administrator</SelectItem>
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button className="mr-2 w-full" onClick={createUser}>Dodaj</Button>
                    </TableCell>
                </TableRow>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>
                            <Input type="text" value={user.username} onChange={(e) => modifyUserField(user.id, "username", e.target.value)} className="border rounded px-2 py-1 w-full" />
                        </TableCell>
                        <TableCell>
                            <Input type="text" value={user.card} onChange={(e) => modifyUserField(user.id, "card", e.target.value)} className="border rounded px-2 py-1 w-full" />
                        </TableCell>
                        <TableCell>
                            {new Date(user.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                            <Select defaultValue={user.isAdmin ? "1" : "0"} onValueChange={(value) => modifyUserField(user.id, "isAdmin", value === "1")}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Użytkownik" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    <SelectItem value="0">Użytkownik</SelectItem>
                                    <SelectItem value="1">Administrator</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant={'ghost'} className="w-full" onClick={() => updateUser(user.id)}>Zapisz</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>

        <h1 className="text-2xl font-bold my-4">Liczenia</h1>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Data otwarcia</TableHead>
                    <TableHead>Data ostatecznego</TableHead>
                    <TableHead>Data zamknięcia</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell className="font-medium">-</TableCell>
                    <TableCell>
                        <Input type="text" value={newCount.name} onChange={(e) => setNewCount({ ...newCount, name: e.target.value })} placeholder="Nazwa" className="border rounded px-2 py-1 w-full" />
                    </TableCell>
                    <TableCell>
                        <Input type="datetime-local" value={newCount.open_at} onChange={(e) => setNewCount({ ...newCount, open_at: e.target.value })} className="border rounded px-2 py-1 w-full" />
                    </TableCell>
                    <TableCell>
                        <Input type="datetime-local" value={newCount.final_at} onChange={(e) => setNewCount({ ...newCount, final_at: e.target.value })} className="border rounded px-2 py-1 w-full" />
                    </TableCell>
                    <TableCell>
                        <Input type="datetime-local" value={newCount.closed_at} onChange={(e) => setNewCount({ ...newCount, closed_at: e.target.value })} className="border rounded px-2 py-1 w-full" />
                    </TableCell>
                    <TableCell className="text-right">
                        <Button className="mr-2 w-full" onClick={createCount}>Dodaj</Button>
                    </TableCell>
                </TableRow>
                {counts.map((count) => (
                    <TableRow key={count.id}>
                        <TableCell className="font-medium">{count.id}</TableCell>
                        <TableCell>
                            <Input type="text" value={count.name} onChange={(e) => modifyCountField(count.id, 'name', e.target.value)} className="border rounded px-2 py-1 w-full" />
                        </TableCell>
                        <TableCell>
                            <Input type="datetime-local" defaultValue={count.open_at ? new Date(count.open_at).toISOString().slice(0, 16) : ""} onChange={(e) => modifyCountField(count.id, 'open_at', e.target.value)} className="border rounded px-2 py-1 w-full" />
                        </TableCell>
                        <TableCell>
                            <Input type="datetime-local" defaultValue={count.final_at ? new Date(count.final_at).toISOString().slice(0, 16) : ""} onChange={(e) => modifyCountField(count.id, 'final_at', e.target.value)} className="border rounded px-2 py-1 w-full" />
                        </TableCell>
                        <TableCell>
                            <Input type="datetime-local" defaultValue={count.closed_at ? new Date(count.closed_at).toISOString().slice(0, 16) : ""} onChange={(e) => modifyCountField(count.id, 'closed_at', e.target.value)} className="border rounded px-2 py-1 w-full" />
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant={'ghost'} className="w-full" onClick={() => updateCount(count.id)}>Zapisz</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>;
}

export default SettingsPage;