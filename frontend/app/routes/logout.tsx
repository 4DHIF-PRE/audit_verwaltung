import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
    return redirect("/login");
};

export const action: ActionFunction = async ({ request }) => {
    const cookie = request.headers.get("cookie");

    try {
        const response = await fetch("http://localhost:3000/logout", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookie || ""
            }
        });

        // Redirect to login and clear the cookie
        return redirect('/login', {
            headers: {
                "Set-Cookie": "gruppe2session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
            },
        });

    } catch (error) {
        console.error("Logout error:", error);
        // Even if there's an error, clear the cookie and redirect
        return redirect('/login', {
            headers: {
                "Set-Cookie": "gruppe2session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
            },
        });
    }
};