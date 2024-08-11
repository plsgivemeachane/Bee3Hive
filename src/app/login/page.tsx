"use client";
import Link from "next/link";
import { toast } from "sonner"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { SunMoonIcon } from "lucide-react";
import { API_ENDPOINT } from "../utils/Endpoint";
import { useRouter } from "next/navigation";
// import { signIn } from "../supabaseClient";


export default function LoginForm() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const setDarkMode = (mode: boolean) => {
        localStorage.setItem("darkmode", mode.toString());
        setIsDarkMode(mode);
    };

    useEffect(() => {
        //* Theme saving
        let isSavedDarkMode = localStorage.getItem("darkmode");
        if (isSavedDarkMode && isSavedDarkMode == "true") {
            setIsDarkMode(true);
        }

        // toast.("LOL", {
        //     description: "Test",
        //     action: {
        //         label: "Ok",
        //         onClick: () => console.log("Ok"),
        //     },         
        // })
    });

    const loginAccount = async () => {
        if(!email || !password) return;
        console.log(email, password);
        try {
            const response = await fetch(API_ENDPOINT + "auth/email/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            })

            if(response.status != 200) {
                toast.error("Please check your email and password and try again")
                return;
            }

            const json = await response.json();

            //* json: { token: string } JSON WEB TOKEN

            if(json.token) {
                console.log(json)
                localStorage.setItem("token", json.token);
                router.push("/");
            } else {
                // Error wtf?
                toast.error("Error on login [API ERROR]", {
                    description: "Please try again or contact support",
                });
            }
        } catch(e) {
            console.log(e)
            toast.error("Fail to fetch", {
                description: "If this problems continue, please contact support",
            })
        }
    }

    return (
        <div className={`flex min-h-screen items-center justify-center bg-background ${isDarkMode ? "dark" : ""}`}>
        <Card className="mx-auto max-w-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-full text-foreground`}
                        onClick={() => setDarkMode(!isDarkMode)}
                    >
                        <SunMoonIcon className="h-5 w-5" />
                        <span className="sr-only">Toggle dark mode</span>
                    </Button>
                </div>
                <CardDescription>
                    Enter your email below to login to your account on Bee3Hive (Early access)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                    />
                    </div>
                    <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        {/* <Link href="#" className="ml-auto inline-block text-sm underline">
                            Forgot your password?
                        </Link> */}
                    </div>
                    <Input 
                        id="password" 
                        type="password" 
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        required
                    />
                    </div>
                    <Button type="submit" className="w-full" onClick={loginAccount}>
                    Login
                    </Button>
                    {/* <Button variant="outline" className="w-full">
                        Login with Google
                    </Button> */}
                </div>
                <div className="mt-4 text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="underline">
                    Sign up
                    </Link>
                </div>
            </CardContent>
        </Card>
        </div>
    );
}
