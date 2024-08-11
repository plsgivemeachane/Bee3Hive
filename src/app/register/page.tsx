'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react";
import { SunMoonIcon } from "lucide-react";
import { toast } from "sonner"
import { API_ENDPOINT } from "../utils/Endpoint"
import { useRouter } from "next/navigation"

export default function RegisterForm() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");
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
    });

    const registerAccount = async () => {
        if(!username || !email || !password || !confirmPassword) return;
        if(password != confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if(username.length < 6) {
            toast.error("Username too short")
        }

        try {
            const response = await fetch(API_ENDPOINT + "auth/email/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password })
            })

            if(!response.ok) {
                toast.error("Cannot create account with this information", {
                    description: await response.text()
                })
                return;
            }

            const json = await response.json(); // { token: string }

            localStorage.setItem("token", json.token);
            router.push("/")
        } catch(e) {
            console.log(e);
            toast.error("Cannot create account with this information")
        }
    }

    return (
        <div className={`flex min-h-screen items-center justify-center bg-background ${isDarkMode ? "dark" : ""}`}>
            <Card className="mx-auto max-w-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Sign Up</CardTitle>
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
                    Enter your information to create an account on Bee3Hive (Early access)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Username</Label>
                            <Input
                            id="text"
                            type="text"
                            placeholder="johndoe"
                            required
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required onChange={(e) => setPassword(e.target.value)} value={password}/>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Confirm password</Label>
                            <Input id="cpassword" type="password" required onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword}/>
                        </div>
                        <Button type="submit" className="w-full" onClick={registerAccount}>
                            Create an account
                        </Button>
                        {/* <Button variant="outline" className="w-full">
                            Sign up with GitHub
                        </Button> */}
                    </div>
                    <div className="mt-4 text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="underline">
                        Sign in
                    </Link>
                    </div>
                </CardContent>
                </Card>
        </div>
    );
}
