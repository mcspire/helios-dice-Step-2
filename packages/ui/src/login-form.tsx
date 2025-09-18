"use client";

import { useState } from "react";
import { Button } from "./button";
import { FormField, HelperText, Input, Label } from "./form";
import { pushToast } from "./toaster";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    pushToast("Login simuliert – Auth-Service folgt");
    setIsPending(false);
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
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Anmeldung läuft…" : "Anmelden"}
      </Button>
    </form>
  );
}
