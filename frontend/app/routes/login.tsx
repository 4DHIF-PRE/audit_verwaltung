import * as React from "react"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {Form, Link} from "@remix-run/react";
import {ActionFunctionArgs, createCookie, redirect} from "@remix-run/node";
import { createCookieSessionStorage } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    throw new Error("SESSION_SECRET is not defined in the environment variables."+ sessionSecret);
}

export const { getSession, commitSession, destroySession } = createCookieSessionStorage({
    cookie: {
        name: "gruppe2session",
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        secrets:  [sessionSecret]
    },
});

export async function action({
                                 request,
                             }: ActionFunctionArgs) {
    const body = await request.formData();
    const email = body.get("email");
    const password = body.get("password");

    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password })
    });

    if (response.ok) {
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
            return redirect("/", {
                headers: {
                    "Set-Cookie": setCookieHeader
                },
            });
        }
    }

    return response.json();
}

export default function Login() {

    return (
        <div className="flex justify-center items-center w-full mt-52">
            <Card className="w-[350px]">
                <CardHeader className="justify-center items-center text-2xl">
                    <CardTitle>Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Form method="post">
                                <Label htmlFor="email">Email</Label>
                                <Input name="email" autoComplete="email" id="email" placeholder="Enter your email address" />
                                <Label htmlFor="password">Password</Label>
                                <Input name="password" autoComplete="current-password" id="password" placeholder="Enter your password" type="password"/>
                                <div className="flex flex-col">
                                    <Button className="mr-2" variant="link">Forgot password?</Button>
                                    <Button type="submit">Login</Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
