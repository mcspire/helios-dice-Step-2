import { AuthLayout } from "@helios/ui/auth-layout";
import { RegisterForm } from "@helios/ui/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Neues HELIOS Konto"
      subtitle="Erstelle ein Profil und sichere dir deinen Charakterzugang"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
