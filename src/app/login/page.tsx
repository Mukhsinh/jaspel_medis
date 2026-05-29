"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Stethoscope, ShieldCheck, Lock, User } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-[400px] border-none shadow-2xl shadow-slate-200/50 relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
                <CardHeader className="space-y-1 text-center pt-8 pb-4">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                            <Stethoscope className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Jaspel Medis</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Enterprise Hospital Incentive System</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User className="h-3 w-3" /> Email Institusi
                        </Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                placeholder="nama@rsud.go.id"
                                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl pl-4"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Lock className="h-3 w-3" /> Kata Sandi
                            </Label>
                            <a href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter">Lupa Password?</a>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl pl-4"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]">
                        Masuk ke Dashboard
                    </Button>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t p-6 flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                        Sistem Aman Terverifikasi &bullet; RSUD Dr. Soegiri
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
