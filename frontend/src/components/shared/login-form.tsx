"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { profileAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Loader2, Salad } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check if profile exists -> route accordingly
      try {
        await profileAPI.get();
        router.push("/dashboard");
      } catch {
        router.push("/profile-setup");
      }
      router.refresh();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid credentials",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-brand-100 rounded-full">
            <Salad className="h-8 w-8 text-brand-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>Sign in to your nutrition assistant</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password" type="password" placeholder="Your password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
            ) : "Sign In"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-brand-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
