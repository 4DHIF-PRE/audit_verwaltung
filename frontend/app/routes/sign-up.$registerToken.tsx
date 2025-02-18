import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Link, useLoaderData } from "@remix-run/react";
import * as React from "react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useState } from "react";

export async function loader({ params }: LoaderFunctionArgs) {
    const registerToken = params.registerToken;

    const response = await fetch("http://localhost:3000/registration/viewTokens", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const tokens = await response.json();

    const tokenExists = tokens.some((token: any) => token.rp_registrationId === registerToken);

    if (!tokenExists) {
        return redirect("/login");
    }

    return json({ ok: 200, registerToken });
}

export default function SignUp() {
    const { registerToken } = useLoaderData<typeof loader>();

    const [formData, setFormData] = useState({
        registrationToken: registerToken,
        password: "",
    });

    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (formData.password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        console.log(formData);
        try {
            const response = await fetch("http://localhost:3000/registration/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // Der Body enthält nun auch den registrationToken
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to sign up. Please try again.");
            }

            const result = await response.json();
            setSuccess("Sign up successful!");
        } catch (error: any) {
            setError(error.message || "Something went wrong");
        }
    }

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        setFormData({
            ...formData,
            [event.target.id]: event.target.value,
        });
    }

    return (
        <div className="flex justify-center items-center w-full mt-44">
            <Card className="w-[350px]">
                <CardHeader className="justify-center items-center text-2xl">
                    <CardTitle>Sign up</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                        {/* Das Passwort-Feld */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="shadow-sm"
                            />
                        </div>
                        {/* Bestätigung des Passworts */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="shadow-sm"
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                                {success}
                            </div>
                        )}
                        <Button type="submit" className="w-full">
                            Create Account
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col justify-center items-center w-full">
                    <div className="flex flex-row justify-center items-center w-full mt-2">
                        <p>Already have an account?</p>
                        <Link to="/login">
                            <Button variant="link">Login</Button>
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
