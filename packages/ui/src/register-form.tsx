"use client";

import { useState } from "react";
import { Button } from "./button";
import { FormField, HelperText, Input, Label } from "./form";
import { pushToast } from "./toaster";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    pushToast("Registrierung simuliert – Verifikation folgt");
    setIsPending(false);
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
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Registriere…" : "Registrieren"}
      </Button>
    </form>
  );
}
