import {BaseLayout} from "~/layout";
import {json, LoaderFunctionArgs} from "@remix-run/node";
import {getSession} from "~/routes/login";
import {useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {Button} from "~/components/ui/button";
import {Trash, Trash2} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "~/components/ui/alert-dialog";



interface User {
    u_userId: string;
    u_firstname: string;
    u_lastname: string;
    u_email: string;
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
    console.log(await response.json());

    const users: User[] = [
        {
            u_userId: 'testuser1',
            u_firstname: 'Maier',
            u_lastname: 'Max',
            u_email: 'maier.max@gmail.com',
        },
        {
            u_userId: 'testuser2',
            u_firstname: 'John',
            u_lastname: 'Doe',
            u_email: 'john.doe@gmail.com',
        },
        {
            u_userId: 'testuser3',
            u_firstname: 'Jane',
            u_lastname: 'Smith',
            u_email: 'jane.smith@gmail.com',
        },
    ];

     return json({ users });
};

export default function Users() {
    const { users: initialUsers } = useLoaderData<typeof loader>();
    const [users, setUsers] = useState<User[]>(initialUsers);

    const handleDelete = (userId: string) => {
        setUsers(prevUsers => prevUsers.filter(user => user.u_userId !== userId));
    };

    return (
        <BaseLayout>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Users</h1>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                        <tr className="dark:bg-gray-100 dark:text-black">
                            <th className="py-2 px-4 border-b">User ID</th>
                            <th className="py-2 px-4 border-b">First Name</th>
                            <th className="py-2 px-4 border-b">Last Name</th>
                            <th className="py-2 px-4 border-b">Email</th>
                            <th className="py-2 px-4 border-b">Delete</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => (
                            <tr key={user.u_userId} className="dark:text-black">
                                <td className="py-2 px-4 border-b">{user.u_userId}</td>
                                <td className="py-2 px-4 border-b">{user.u_firstname}</td>
                                <td className="py-2 px-4 border-b">{user.u_lastname}</td>
                                <td className="py-2 px-4 border-b">{user.u_email}</td>
                                <td className="py-2 px-4 border-b">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the user
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

