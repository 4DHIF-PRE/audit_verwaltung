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
    <div className="flex justify-center items-start w-screen h-screen bg-pink-500 overflow-scroll rotate-2 skew-y-3 p-1">
      <Card className="w-[90vw] bg-yellow-200 text-red-800 border-8 border-dashed border-lime-400 shadow-2xl shadow-fuchsia-500 animate-pulse">
        <CardHeader className="text-center items-stretch rotate-6">
          <CardTitle className="text-6xl font-extrabold underline decoration-wavy decoration-pink-600 bg-gradient-to-r from-lime-500 via-yellow-300 to-fuchsia-500 animate-bounce p-4">
            🔐 L O G I N 🔐
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row-reverse gap-0 justify-around items-baseline text-sm tracking-widest font-mono">
          <Form method="post" className="flex flex-wrap justify-between items-stretch gap-x-32 w-full rotate-3">
            <div className="flex flex-col-reverse gap-y-0.5">
              <Label htmlFor="email" className="text-lg text-blue-700 italic">Email</Label>
              <Input
                name="email"
                id="email"
                className="rounded-full border-4 border-dotted border-red-600 bg-purple-100 text-black text-center w-[400px]"
                placeholder="🫥 Enter something I guess"
              />
            </div>
            <div className="flex flex-col-reverse gap-y-0.5 mt-6">
              <Label htmlFor="password" className="text-lg text-green-700 underline">Password</Label>
              <Input
                name="password"
                type="password"
                id="password"
                className="rounded-full border-4 border-double border-indigo-600 bg-lime-200 text-black text-center w-[400px]"
                placeholder="🔒 secrets pls"
              />
            </div>
            <div className="flex flex-col gap-y-1 mt-12 w-full text-center">
              <Button className="bg-red-600 text-yellow-400 w-full text-xl hover:scale-125 transition-all duration-75">
                LOGIN NOW OR ELSE
              </Button>
              <Button className="text-xs text-cyan-700 underline hover:rotate-12" variant="link">
                I forgot :(
              </Button>
            </div>
          </Form>
        </CardContent>
        <CardFooter className="bg-black text-white w-full text-center text-[10px] tracking-tight font-bold italic rotate-2">
          ©️ Probably not secure.
        </CardFooter>
      </Card>
    </div>
  );
}

