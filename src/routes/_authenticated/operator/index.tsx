import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DOC_TYPES,
  catatAudit,
  db,
  fmtWIB,
  STATUS_CLASS,
  STATUS_LABEL,
  type RegStatus,
} from "@/lib/spmb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/CopyButton";

export const Route = createFileRoute("/_authenticated/operator/")({
  component: DaftarPendaftar,
});

type Reg = {
  id: string;
  registration_number: string | null;
  full_name: string | null;
  nisn: string | null;
  status: RegStatus;
  submitted_at: string | null;
  parent_phone: string | null;
  previous_school: string | null;
  verify_note: string | null;
  total_score: number | null;
  first_choice_id: string | null;
  second_choice_id: string | null;
};

type Doc = {
  id: string;
  doc_type: string;
  file_path: string;
  file_name: string | null;
  status: "pending" | "approved" | "rejected";
  note: string | null;
};

const FILTER: { key: string; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "submitted", label: "Menunggu Verifikasi" },
  { key: "verified", label: "Terverifikasi" },
  { key: "rejected", label: "Perlu Perbaikan" },
  { key: "accepted", label: "Diterima" },
  { key: "not_accepted", label: "Tidak Diterima" },
  { key: "enrolled", label: "Daftar Ulang Selesai" },
];

function DaftarPendaftar() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Reg | null>(null);

  const { data: rows, refetch } = useQuery({
    queryKey: ["op-registrations"],
    queryFn: async () => {
      const { data } = await db
        .from("registrations")
        .select("*")
        .neq("status", "draft")
        .order("submitted_at", { ascending: false });
      return (data ?? []) as Reg[];
    },
  });

  const { data: majors } = useQuery({
    queryKey: ["majors-all-op"],
    queryFn: async () => {
      const { data } = await db.from("majors").select("id,code,name");
      return (data ?? []) as { id: string; code: string; name: string }[];
    },
  });

  const { data: criteria } = useQuery({
    queryKey: ["criteria"],
    queryFn: async () => {
      const { data } = await db.from("criteria").select("*").eq("active", true).order("sort_order");
      return (data ?? []) as { id: string; code: string; name: string; weight: number; max_value: number }[];
    },
  });

  const { data: docs, refetch: refetchDocs } = useQuery({
    queryKey: ["op-docs", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => {
      const { data } = await db.from("documents").select("*").eq("registration_id", selected!.id);
      return (data ?? []) as Doc[];
    },
  });

  const { data: scores, refetch: refetchScores } = useQuery({
    queryKey: ["op-scores", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => {
      const { data } = await db
        .from("registration_scores")
        .select("*")
        .eq("registration_id", selected!.id);
      return (data ?? []) as { criteria_id: string; value: number }[];
    },
  });

  const daftar = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      const okStatus = filter === "all" || r.status === filter;
      const okCari =
        !t ||
        (r.full_name ?? "").toLowerCase().includes(t) ||
        (r.registration_number ?? "").toLowerCase().includes(t) ||
        (r.nisn ?? "").includes(t);
      return okStatus && okCari;
    });
  }, [rows, filter, q]);

  async function ubahStatus(reg: Reg, status: RegStatus, note?: string) {
    const payload: Record<string, unknown> = { status, verify_note: note ?? null };
    if (status === "verified") payload["verified_at"] = new Date().toISOString();
    const { error } = await db.from("registrations").update(payload).eq("id", reg.id);
    if (error) {
      toast.error("Gagal memperbarui status.");
      return;
    }
    await catatAudit("ubah_status_pendaftaran", "registrations", reg.id, { status });
    toast.success(`Status diubah menjadi ${STATUS_LABEL[status]}.`);
    setSelected({ ...reg, status });
    void refetch();
  }

  async function ubahDoc(doc: Doc, status: Doc["status"], note?: string) {
    await db.from("documents").update({ status, note: note ?? null }).eq("id", doc.id);
    await catatAudit("verifikasi_dokumen", "documents", doc.id, { status });
    void refetchDocs();
  }

  async function bukaBerkas(path: string) {
    const { data } = await supabase.storage.from("dokumen").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
    else toast.error("Berkas tidak dapat dibuka.");
  }

  async function simpanNilai(criteriaId: string, value: number) {
    if (!selected) return;
    await db.from("registration_scores").upsert(
      { registration_id: selected.id, criteria_id: criteriaId, value },
      { onConflict: "registration_id,criteria_id" },
    );
    void refetchScores();
  }

  const namaJurusan = (id: string | null) => majors?.find((m) => m.id === id)?.name ?? "-";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, NISN, atau nomor pendaftaran"
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {FILTER.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="p-3 font-medium">No. Pendaftaran</th>
              <th className="p-3 font-medium">Nama</th>
              <th className="p-3 font-medium">Pilihan 1</th>
              <th className="p-3 font-medium">Dikirim</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {daftar.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.registration_number}</td>
                <td className="p-3">{r.full_name ?? "-"}</td>
                <td className="p-3">{namaJurusan(r.first_choice_id)}</td>
                <td className="p-3 text-muted-foreground">{fmtWIB(r.submitted_at)}</td>
                <td className="p-3">
                  <Badge className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                    Periksa
                  </Button>
                </td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  Belum ada pendaftar yang cocok dengan filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.full_name ?? "Tanpa nama"}</DialogTitle>
                <DialogDescription>
                  {selected.registration_number} · NISN {selected.nisn ?? "-"} ·{" "}
                  {selected.previous_school ?? "-"}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                {selected.registration_number && (
                  <CopyButton value={selected.registration_number} label="Salin nomor" />
                )}
                {selected.parent_phone && (
                  <CopyButton value={selected.parent_phone} label="Salin nomor HP" />
                )}
              </div>

              <section>
                <h3 className="text-sm font-semibold">Dokumen</h3>
                <div className="mt-2 space-y-2">
                  {DOC_TYPES.map((t) => {
                    const d = docs?.find((x) => x.doc_type === t.key);
                    return (
                      <div
                        key={t.key}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                      >
                        <span>{t.label}</span>
                        {d ? (
                          <span className="flex items-center gap-2">
                            <Badge
                              className={
                                d.status === "approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : d.status === "rejected"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-amber-100 text-amber-800"
                              }
                            >
                              {d.status === "approved"
                                ? "Disetujui"
                                : d.status === "rejected"
                                  ? "Ditolak"
                                  : "Menunggu"}
                            </Badge>
                            <Button size="sm" variant="ghost" onClick={() => void bukaBerkas(d.file_path)}>
                              Lihat
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => void ubahDoc(d, "approved")}>
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const note = window.prompt("Alasan penolakan berkas ini?");
                                if (note !== null) void ubahDoc(d, "rejected", note);
                              }}
                            >
                              <XCircle className="size-4 text-destructive" />
                            </Button>
                          </span>
                        ) : (
                          <Badge variant="outline">Belum diunggah</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Nilai Seleksi</h3>
                <div className="mt-2 space-y-2">
                  {(criteria ?? []).map((c) => {
                    const v = scores?.find((s) => s.criteria_id === c.id)?.value ?? "";
                    return (
                      <div key={c.id} className="flex items-center gap-3 text-sm">
                        <span className="flex-1">
                          {c.name}{" "}
                          <span className="text-muted-foreground">
                            (bobot {c.weight}, maks {c.max_value})
                          </span>
                        </span>
                        <Input
                          type="number"
                          className="w-28"
                          defaultValue={v}
                          min={0}
                          max={c.max_value}
                          onBlur={(e) => void simpanNilai(c.id, Number(e.target.value || 0))}
                        />
                      </div>
                    );
                  })}
                  {(criteria ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Belum ada kriteria aktif. Tambahkan di tab Pengaturan.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Keputusan Verifikasi</h3>
                <Textarea
                  className="mt-2"
                  placeholder="Catatan untuk wali murid (opsional, wajib bila menolak)"
                  defaultValue={selected.verify_note ?? ""}
                  id="catatan-verifikasi"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void ubahStatus(selected, "verified")}>
                    Setujui & Verifikasi
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const el = document.getElementById("catatan-verifikasi") as HTMLTextAreaElement | null;
                      const note = el?.value.trim();
                      if (!note) {
                        toast.error("Isi catatan perbaikan terlebih dahulu.");
                        return;
                      }
                      void ubahStatus(selected, "rejected", note);
                    }}
                  >
                    Minta Perbaikan
                  </Button>
                </div>
              </section>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
