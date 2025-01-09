import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Link } from "@remix-run/react";
import * as React from "react";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ params }: LoaderFunctionArgs) {
    const temp = params.registerToken;

    if (temp === "1") {
        return null;
    }
    return redirect("/");
}



export default function SignUp() {
    const [formData, setFormData] = React.useState({
        registrationToken: "Test",
        u_firstname: "",
        u_lastname: "",
        u_email: "",
        password: ""
    });

    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");

    async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        console.log(formData);
        try {
            const response = await fetch('http://localhost:3000/registration/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to sign up. Please try again.");
            }

            const result = await response.json();
            setSuccess("Sign up successful!"); // Display success message
        } catch (error: any) {
            setError(error.message || "Something went wrong");
        }
    }

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        setFormData({
            ...formData,
            [event.target.id]: event.target.value
        });
    }

    return (
        <div className="flex justify-center items-center w-full mt-44">
            <Card className="w-[350px]">
                <CardHeader className="justify-center items-center text-2xl">
                    <CardTitle>Sign up</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignUp}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="u_firstname">First Name</Label>
                                <Input
                                    autoComplete="given-name"
                                    id="u_firstname"
                                    placeholder="Enter your first name"
                                    value={formData.u_firstname}
                                    onChange={handleInputChange}
                                />
                                <Label htmlFor="u_lastname">Last Name</Label>
                                <Input
                                    autoComplete="family-name"
                                    id="u_lastname"
                                    placeholder="Enter your last name"
                                    value={formData.u_lastname}
                                    onChange={handleInputChange}
                                />
                                <Label htmlFor="u_email">Email</Label>
                                <Input
                                    autoComplete="email"
                                    id="u_email"
                                    placeholder="Enter your email address"
                                    value={formData.u_email}
                                    onChange={handleInputChange}
                                />
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    autoComplete="new-password"
                                    id="password"
                                    placeholder="Enter your password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                        {success && <p className="text-green-500 mt-2">{success}</p>}
                        <Button type="submit" className="w-full mt-4">Sign up</Button>
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
