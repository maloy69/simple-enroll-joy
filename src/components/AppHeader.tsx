import { Link } from "@tanstack/react-router";
import { GraduationCap, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/jurusan", label: "Jurusan" },
  { to: "/alur", label: "Alur Pendaftaran" },
  { to: "/pengumuman", label: "Pengumuman" },
] as const;

export function AppHeader() {
  const { user, isStaff, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold">SPMB Online</span>
            <span className="block text-xs text-muted-foreground">Penerimaan Murid Baru</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isStaff && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/operator">Panel Operator</Link>
                </Button>
              )}
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard Saya</Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Keluar" onClick={() => void signOut()}>
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Masuk / Daftar</Link>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Buka menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {open && (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  Dashboard Saya
                </Link>
                {isStaff && (
                  <Link
                    to="/operator"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    Panel Operator
                  </Link>
                )}
                <button
                  className="rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => void signOut()}
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
              >
                Masuk / Daftar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
