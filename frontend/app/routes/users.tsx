import {BaseLayout} from "~/layout";
import {json, LoaderFunctionArgs} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import React, {useEffect, useState} from "react";
import {Button} from "~/components/ui/button";
import {Footer} from "~/components/Footer";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

interface User {
    u_userId: string;
    u_firstname: string;
    u_lastname: string;
    u_email: string;
    u_deletedAt: string | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const cookie = request.headers.get("cookie");
    const response = await fetch("http://localhost:3000/users/adminView", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookie || "",
        },
        credentials: "include",
    });
    const users = await response.json();
    return json({ users });
};

export default function Users() {
    const { users: initialUsers } = useLoaderData<typeof loader>();
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isModified, setIsModified] = useState(false);

    // State für neuen Benutzer
    const [newUser, setNewUser] = useState({
        firstname: "",
        lastname: "",
        email: "",
        erstellberechtigt: false,
    });

    useEffect(() => {
        if (isModified) {
            window.location.reload();
        }
    }, [isModified]);

    const handleDelete = async (userId: string) => {
        try {
            const response = await fetch("http://localhost:3000/users/deleteUser", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie || "",
                },
                credentials: "include",
                body: JSON.stringify({ u_userId: userId }),
            });

            if (response.ok) {
                setIsModified(true);
            } else {
                const error = await response.json();
                console.error("Failed to delete user:", error.message);
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const restoreUser = async (userId: string) => {
        try {
            const response = await fetch("http://localhost:3000/users/restoreUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie || "",
                },
                credentials: "include",
                body: JSON.stringify({ u_userId: userId }),
            });

            if (response.ok) {
                setIsModified(true);
            } else {
                const error = await response.json();
                console.error("Failed to restore user:", error.message);
            }
        } catch (error) {
            console.error("Error restoring user:", error);
        }
    };

    // Methode zum Erstellen einer neuen Einladung (neuer User) via API
    const handleAddUser = async () => {
        try {
            const response = await fetch("http://localhost:3000/registration/createInvitation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie || "",
                },
                credentials: "include",
                body: JSON.stringify({
                    rp_firstname: newUser.firstname,
                    rp_lastname: newUser.lastname,
                    rp_email: newUser.email,
                    // Falls "erstellberechtigt" auch an den Server soll,
                    // müsstest du das entsprechend in deiner API anpassen.
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Fehler beim Erstellen der Einladung:", errorData.message);
            } else {
                console.log("Einladung erfolgreich erstellt!");
                console.log(response);
            }
        } catch (error) {
            console.error("Fehler beim Erstellen der Einladung:", error);
        }
    };

    return (
        <BaseLayout>
            <div className="flex flex-col h-screen">
                <div className="flex flex-col h-screen container mx-auto p-4">
                    <br />
                    <div className="flex items-center justify-between mb-4 mt-9">
                        <h1 className="text-2xl font-bold">Users</h1>

                        {/* Dialog für "add" */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="bg-green-800 hover:bg-green-600">add</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Add User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bitte fülle die Daten für den neuen Benutzer aus.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                {/* Formularfelder */}
                                <div className="space-y-3 p-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Vorname
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.firstname}
                                            onChange={(e) =>
                                                setNewUser({ ...newUser, firstname: e.target.value })
                                            }
                                            className="w-full border rounded px-2 py-1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Nachname
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.lastname}
                                            onChange={(e) =>
                                                setNewUser({ ...newUser, lastname: e.target.value })
                                            }
                                            className="w-full border rounded px-2 py-1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            E-Mail
                                        </label>
                                        <input
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) =>
                                                setNewUser({ ...newUser, email: e.target.value })
                                            }
                                            className="w-full border rounded px-2 py-1"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={newUser.erstellberechtigt}
                                            onChange={(e) =>
                                                setNewUser({
                                                    ...newUser,
                                                    erstellberechtigt: e.target.checked,
                                                })
                                            }
                                        />
                                        <label className="text-sm">erstellberechtigt</label>
                                    </div>
                                </div>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleAddUser}>
                                        Versenden
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="overflow-x-auto rounded-md">
                        <table className="table-auto min-w-full bg-white border">
                            <thead>
                            <tr className="dark:bg-gray-100 dark:text-black text-left">
                                <th className="py-2 px-4 border-b">First Name</th>
                                <th className="py-2 px-4 border-b">Last Name</th>
                                <th className="py-2 px-4 border-b">Email</th>
                                <th className="py-2 px-4 border-b">DeleteAt</th>
                                <th className="py-2 px-4 border-b border-l text-center">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((user) => (
                                <tr key={user.u_userId} className="dark:text-black">
                                    <td className="py-2 px-4 border-b">{user.u_firstname}</td>
                                    <td className="py-2 px-4 border-b">{user.u_lastname}</td>
                                    <td className="py-2 px-4 border-b">{user.u_email}</td>
                                    <td className="py-2 px-4 border-b">{user.u_deletedAt}</td>
                                    <td className="py-2 px-4 border-b border-l text-center">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                {!user.u_deletedAt ? (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="px-4"
                                                    >
                                                        {/* Trash Icon */}
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="size-6"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                                            />
                                                        </svg>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="px-4 bg-green-800 hover:bg-green-600"
                                                    >
                                                        {/* Restore Icon */}
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="size-6"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                                                            />
                                                        </svg>
                                                    </Button>
                                                )}
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to restore this User?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    {!user.u_deletedAt ? (
                                                        <AlertDialogAction onClick={() => handleDelete(user.u_userId)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    ) : (
                                                        <AlertDialogAction onClick={() => restoreUser(user.u_userId)}>
                                                            Restore
                                                        </AlertDialogAction>
                                                    )}
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Footer />
            </div>
        </BaseLayout>
    );
}
