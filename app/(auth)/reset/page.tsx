import { AuthLayout } from "@helios/ui/auth-layout";
import { PasswordResetForm } from "@helios/ui/password-reset-form";

export default function ResetPage() {
  return (
    <AuthLayout
      title="Passwort zurücksetzen"
      subtitle="Gib deine E-Mail-Adresse ein, um den Reset-Link zu erhalten"
    >
      <PasswordResetForm />
    </AuthLayout>
  );
}
