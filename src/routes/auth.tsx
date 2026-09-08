import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk Akun Wali Murid — SPMB Online" },
      {
        name: "description",
        content:
          "Masuk dengan akun Google untuk mendaftarkan calon murid baru dan memantau status pendaftaran.",
      },
      { property: "og:title", content: "Masuk Akun Wali Murid — SPMB Online" },
      {
        property: "og:description",
        content: "Masuk dengan akun Google untuk mendaftar dan memantau status pendaftaran.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const raw = new URLSearchParams(window.location.search).get("next");
      const next = raw && raw.startsWith("/") ? raw : "/dashboard";
      void navigate({ to: next, replace: true });
    }
  }, [loading, user, navigate]);

  async function masuk() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Gagal masuk dengan Google. Silakan coba lagi.");
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      void navigate({ to: "/dashboard" });
    } catch {
      toast.error("Gagal masuk dengan Google. Silakan coba lagi.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </span>
          <CardTitle className="mt-3 text-2xl">Masuk ke SPMB Online</CardTitle>
          <CardDescription>
            Wali murid wajib masuk menggunakan akun Google agar data pendaftaran tersimpan aman dan
            bisa dilanjutkan kapan saja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="lg" disabled={busy} onClick={() => void masuk()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Masuk dengan Google
          </Button>
          <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
              Data pribadi calon murid hanya dapat dilihat oleh Anda dan operator sekolah. Setiap
              aktivitas penting dicatat dalam log audit.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
