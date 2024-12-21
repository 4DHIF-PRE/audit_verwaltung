import {BaseLayout} from "~/layout";
import {json, LoaderFunctionArgs} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {Button} from "~/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "~/components/ui/alert-dialog";


interface User {
    u_userId: string;
    u_firstname: string;
    u_lastname: string;
    u_email: string;
    u_deletedAt: string | null;
}

export const loader = async ({
                                 request,
                             }: LoaderFunctionArgs) => {
    const cookie = request.headers.get("cookie");

    const response = await fetch('http://localhost:3000/users/adminView', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "Cookie": cookie || ""
        },
        credentials: 'include',
    });
    const users = await response.json();
    console.log(users);
    return json({ users });
};

export default function Users() {
    const {users: initialUsers} = useLoaderData<typeof loader>();
    const [users, setUsers] = useState<User[]>(initialUsers);

    const handleDelete = async (userId: string) => {
        try {
            console.log('cookie' + document.cookie);
            const response = await fetch('http://localhost:3000/users/deleteUser', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    "Cookie": document.cookie || ""
                },
                credentials: 'include',
                body: JSON.stringify({u_userId: userId})
            });

            if (response.ok) {
                setUsers(prevUsers => prevUsers.filter(user => user.u_userId !== userId));
            } else {
                const error = await response.json();
                console.error('Failed to delete user:', error.message);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    return (
        <BaseLayout>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Users</h1>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                        <tr className="dark:bg-gray-100 dark:text-black">
                            {/*<th className="py-2 px-4 border-b">User ID</th>*/}
                            <th className="py-2 px-4 border-b">First Name</th>
                            <th className="py-2 px-4 border-b">Last Name</th>
                            <th className="py-2 px-4 border-b">Email</th>
                            <th className="py-2 px-4 border-b">DeleteAt</th>
                            <th className="py-2 px-4 border-b">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => (
                            <tr key={user.u_userId} className="dark:text-black">
                                {/*<td className="py-2 px-4 border-b">{user.u_userId}</td>*/}
                                <td className="py-2 px-4 border-b">{user.u_firstname}</td>
                                <td className="py-2 px-4 border-b">{user.u_lastname}</td>
                                <td className="py-2 px-4 border-b">{user.u_email}</td>
                                <td className="py-2 px-4 border-b">{user.u_deletedAt}</td>
                                <td className="py-2 px-4 border-b">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                {!user.u_deletedAt ?
                                                <Button variant="destructive" size="sm" className="px-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                         viewBox="0 0 24 24"
                                                         strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                                                    </svg>
                                                </Button>
                                                : <Button  size="sm" className="px-4 bg-green-800 hover:bg-green-600">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                             viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                                                             className="size-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                                                        </svg>
                                                    </Button>
                                                }

                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the
                                                        user
                                                        account and remove their data from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(user.u_userId)}>
                                                        Delete
                                                    </AlertDialogAction>
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
        </BaseLayout>
    );
}

