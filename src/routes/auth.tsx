import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const next = search["next"];
    return typeof next === "string" && next.startsWith("/") ? { next } : {};
  },
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

const NEXT_KEY = "spmb-next";

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (search.next) {
      try {
        window.sessionStorage.setItem(NEXT_KEY, search.next);
      } catch {
        /* abaikan */
      }
    }
  }, [search.next]);

  useEffect(() => {
    if (loading || !user) return;
    let simpan: string | null = null;
    try {
      simpan = window.sessionStorage.getItem(NEXT_KEY);
      window.sessionStorage.removeItem(NEXT_KEY);
    } catch {
      simpan = null;
    }
    const kandidat = search.next ?? simpan;
    const next = kandidat && kandidat.startsWith("/") ? kandidat : "/dashboard";
    void navigate({ to: next, replace: true });
  }, [loading, user, navigate, search.next]);

  async function masuk() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
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
