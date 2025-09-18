"use client";

import { useState } from "react";
import { Button } from "./button";
import { FormField, HelperText, Input, Label } from "./form";
import { pushToast } from "./toaster";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    pushToast("Reset-E-Mail simuliert – Produktivservice folgt");
    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField>
        <Label htmlFor="reset-email">E-Mail</Label>
        <Input
          id="reset-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>
      <HelperText>Wir senden dir einen Link zum Zurücksetzen deines Passworts.</HelperText>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sende…" : "Link senden"}
      </Button>
    </form>
  );
}
