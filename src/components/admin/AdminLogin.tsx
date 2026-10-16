"use client";

import { useState, type FormEvent } from "react";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Invalid beta admin credentials.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Unable to connect to the authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md rounded-[1.5rem] p-6 sm:p-7">
        <div className="mb-7 flex items-center gap-3">
          <div className="glass-control flex h-11 w-11 items-center justify-center rounded-2xl">
            <LockKeyhole className="h-5 w-5 text-accent" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
              Admin Access
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Clinical administration & telemetry console.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="e.g. admin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Enter admin password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            {error}
          </div>
        )}

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? "Verifying..." : "Enter Admin Panel"}
        </Button>

        <div className="mt-4 rounded-xl bg-accent/5 p-3 text-[11px] leading-relaxed text-muted-foreground/80 border border-accent/10">
          <span className="font-semibold text-foreground/80">Security Notice:</span> Access restricted to authorized clinical administrators only. Sessions are cryptographically signed.
        </div>
      </form>
    </div>
  );
}
