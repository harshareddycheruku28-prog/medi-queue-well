import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RoleGuard } from "@/components/role-guard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Stethoscope, Loader2 } from "lucide-react";
import { createDoctor, updateDoctor, deleteDoctor } from "@/lib/doctors-admin.functions";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/receptionist/doctors")({
  component: () => (
    <RoleGuard role="receptionist">
      <Page />
    </RoleGuard>
  ),
});

const DAYS = [
  ["Mon", 1],
  ["Tue", 2],
  ["Wed", 3],
  ["Thu", 4],
  ["Fri", 5],
  ["Sat", 6],
  ["Sun", 7],
] as const;

type DoctorRow = {
  id: string;
  profile_id: string;
  department_id: string;
  specialization: string | null;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  max_patients_per_day: number;
  working_days: number[];
  departments: { name: string; code: string } | null;
  profiles: { full_name: string; email: string | null; phone: string | null } | null;
};

function Page() {
  const qc = useQueryClient();
  const createFn = useServerFn(createDoctor);
  const updateFn = useServerFn(updateDoctor);
  const deleteFn = useServerFn(deleteDoctor);
  const { t } = useTranslation();

  const { data: departments = [] } = useQuery({
    queryKey: ["depts"],
    queryFn: async () => (await supabase.from("departments").select("*").order("name")).data ?? [],
  });
  const { data: doctors = [], isLoading } = useQuery<DoctorRow[]>({
    queryKey: ["doctors-admin"],
    queryFn: async () =>
      ((
        await supabase
          .from("doctors")
          .select("*, departments(name,code), profiles:profile_id(full_name,email,phone)")
          .order("created_at", { ascending: false })
      ).data as DoctorRow[]) ?? [],
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorRow | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["doctors-admin"] });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const working_days = DAYS.map(([, n]) => n as number).filter((n) => f.get(`day_${n}`) === "on");
    setBusy(true);
    try {
      await createFn({
        data: {
          email: String(f.get("email")),
          password: String(f.get("password")),
          full_name: String(f.get("full_name")),
          phone: String(f.get("phone") ?? ""),
          department_id: String(f.get("department_id")),
          specialization: String(f.get("specialization") ?? ""),
          start_time: String(f.get("start_time")),
          end_time: String(f.get("end_time")),
          slot_minutes: Number(f.get("slot_minutes")),
          max_patients_per_day: Number(f.get("max_patients_per_day")),
          working_days,
        },
      });
      toast.success(t("recep_docs_created_toast"));
      setCreateOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create doctor");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget);
    const working_days = DAYS.map(([, n]) => n as number).filter((n) => f.get(`day_${n}`) === "on");
    setBusy(true);
    try {
      await updateFn({
        data: {
          doctor_id: editing.id,
          full_name: String(f.get("full_name")),
          phone: String(f.get("phone") ?? ""),
          department_id: String(f.get("department_id")),
          specialization: String(f.get("specialization") ?? ""),
          start_time: String(f.get("start_time")),
          end_time: String(f.get("end_time")),
          slot_minutes: Number(f.get("slot_minutes")),
          max_patients_per_day: Number(f.get("max_patients_per_day")),
          working_days,
        },
      });
      toast.success(t("recep_docs_updated_toast"));
      setEditing(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update doctor");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFn({ data: { doctor_id: id } });
      toast.success(t("recep_docs_deleted_toast"));
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete doctor");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("recep_docs_title")}</h1>
          <p className="text-muted-foreground">{t("recep_docs_subtitle")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t("recep_docs_btn_add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("recep_docs_modal_title")}</DialogTitle>
              <DialogDescription>
                {t("recep_docs_modal_subtitle")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <DoctorFormFields departments={departments} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{t("auth_label_email")}</Label>
                  <Input name="email" type="email" required />
                </div>
                <div className="space-y-1">
                  <Label>{t("auth_label_password")}</Label>
                  <Input name="password" type="password" required minLength={6} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("recep_docs_btn_save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" /> {t("recep_docs_list_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid place-items-center p-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
              {t("recep_docs_none")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2">{t("recep_docs_th_name")}</th>
                    <th className="p-2">{t("auth_label_department")}</th>
                    <th className="p-2">{t("auth_label_specialization")}</th>
                    <th className="p-2">{t("recep_docs_th_shift")}</th>
                    <th className="p-2">{t("recep_docs_th_contact")}</th>
                    <th className="p-2 text-right">{t("dr_queue_th_actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="p-2 font-medium">Dr. {d.profiles?.full_name}</td>
                      <td className="p-2">
                        <Badge variant="secondary">{t("dept_name_" + d.departments?.name)}</Badge>
                      </td>
                      <td className="p-2">{d.specialization || "—"}</td>
                      <td className="p-2">
                        {String(d.start_time).slice(0, 5)}–{String(d.end_time).slice(0, 5)}
                      </td>
                      <td className="p-2 text-xs">
                        <div>{d.profiles?.email}</div>
                        <div className="text-xs text-muted-foreground">{d.profiles?.phone}</div>
                      </td>
                      <td className="p-2">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditing(d)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("recep_docs_delete_title", { name: d.profiles?.full_name })}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("recep_docs_delete_desc")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("my_appts_cancel_btn")}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(d.id)}>
                                  {t("recep_docs_btn_delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit doctor</DialogTitle>
            <DialogDescription>Update the doctor's details and schedule.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="space-y-3">
              <DoctorFormFields departments={departments} initial={editing} />
              <DialogFooter>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("profile_save_btn")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DoctorFormFields({ departments, initial }: { departments: any[]; initial?: DoctorRow }) {
  const { t } = useTranslation();
  const initDays = initial?.working_days ?? [1, 2, 3, 4, 5];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{t("auth_label_fullname")}</Label>
          <Input name="full_name" defaultValue={initial?.profiles?.full_name ?? ""} required />
        </div>
        <div className="space-y-1">
          <Label>{t("auth_label_phone")}</Label>
          <Input name="phone" defaultValue={initial?.profiles?.phone ?? ""} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{t("auth_label_department")}</Label>
          <Select name="department_id" defaultValue={initial?.department_id} required>
            <SelectTrigger>
              <SelectValue placeholder={t("auth_placeholder_select_dept")} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {t("dept_name_" + d.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t("auth_label_specialization")}</Label>
          <Input name="specialization" defaultValue={initial?.specialization ?? ""} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{t("dr_avail_start_time")}</Label>
          <Input
            name="start_time"
            type="time"
            defaultValue={String(initial?.start_time ?? "09:00").slice(0, 5)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>{t("dr_avail_end_time")}</Label>
          <Input
            name="end_time"
            type="time"
            defaultValue={String(initial?.end_time ?? "17:00").slice(0, 5)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>{t("dr_avail_slot_duration")}</Label>
          <Input
            name="slot_minutes"
            type="number"
            min={5}
            max={120}
            defaultValue={initial?.slot_minutes ?? 15}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>{t("dr_avail_max_patients")}</Label>
          <Input
            name="max_patients_per_day"
            type="number"
            min={1}
            defaultValue={initial?.max_patients_per_day ?? 30}
            required
          />
        </div>
      </div>
      <div>
        <Label className="mb-2 block">{t("dr_avail_active_days")}</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(([lbl, n]) => (
            <label
              key={n}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name={`day_${n}`}
                defaultChecked={initDays.includes(n as number)}
                className="h-4 w-4 accent-primary"
              />
              {t(lbl)}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
