import { AuthLayout } from "@helios/ui/auth-layout";
import { LoginForm } from "@helios/ui/login-form";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Willkommen zurück"
      subtitle="Melde dich an, um deine HELIOS Sessions zu betreten"
    >
      <LoginForm />
    </AuthLayout>
  );
}
