"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { FormField, HelperText, Input, Label } from "./form";
import { pushToast } from "./toaster";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError((data as { error?: string }).error ?? "Anmeldung fehlgeschlagen");
        return;
      }

      pushToast(`Willkommen zurück, ${(data as { user?: { displayName?: string } }).user?.displayName ?? "Operator"}!`);
      router.push("/");
      router.refresh();
    } catch (error) {
      setError("Unerwarteter Fehler – bitte versuche es erneut");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField>
        <Label htmlFor="login-email">E-Mail</Label>
        <Input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>
      <FormField>
        <Label htmlFor="login-password">Passwort</Label>
        <Input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>
      <HelperText>2FA, OAuth und Passwort-Reset werden in späteren Iterationen ergänzt.</HelperText>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Anmeldung läuft…" : "Anmelden"}
      </Button>
    </form>
  );
}
