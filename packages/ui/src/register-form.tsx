"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { FormField, HelperText, Input, Label } from "./form";
import { pushToast } from "./toaster";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError((data as { error?: string }).error ?? "Registrierung fehlgeschlagen");
        return;
      }

      pushToast("Account erstellt – willkommen bei HELIOS!");
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
        <Label htmlFor="register-display-name">Anzeigename</Label>
        <Input
          id="register-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
        />
      </FormField>
      <FormField>
        <Label htmlFor="register-email">E-Mail</Label>
        <Input
          id="register-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>
      <FormField>
        <Label htmlFor="register-password">Passwort</Label>
        <Input
          id="register-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>
      <HelperText>Durch Registrierung akzeptierst du die Datenschutzbestimmungen.</HelperText>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Registriere…" : "Registrieren"}
      </Button>
    </form>
  );
}
