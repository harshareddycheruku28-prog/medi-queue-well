import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { hospitals } from "@/lib/mock-data";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalIcon, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/components/role-guard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { generateSlots, dayOfWeekIso } from "@/lib/slots";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/patient/book")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      hospitalId: search.hospitalId as string | undefined,
    };
  },
  component: () => (
    <RoleGuard role="patient">
      <Page />
    </RoleGuard>
  ),
});

function Page() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<any>(null);
  const { t } = useTranslation();

  const { hospitalId } = Route.useSearch();
  const selectedHospital = hospitals.find(h => h.id === hospitalId);

  const { data: allDepartments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await supabase.from("departments").select("*").order("name")).data ?? [],
  });

  const departments = selectedHospital 
    ? allDepartments.filter(d => selectedHospital.departments.includes(d.code))
    : allDepartments;

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["doctors", departmentId],
    enabled: !!departmentId,
    queryFn: async () =>
      (
        await supabase
          .from("doctors")
          .select("*, profiles:profile_id(full_name)")
          .eq("department_id", departmentId)
      ).data ?? [],
  });

  const doctor = doctors.find((d) => d.id === doctorId);

  const { data: bookedSlots = [] } = useQuery<string[]>({
    queryKey: ["booked", doctorId, date],
    enabled: !!doctorId && !!date,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("slot_time")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", date)
        .neq("status", "cancelled");
      return (data ?? []).map((x) => x.slot_time as string);
    },
  });

  const slots = useMemo(() => {
    if (!doctor) return [];
    const dow = dayOfWeekIso(date);
    if (!(doctor.working_days as number[]).includes(dow)) return [];
    return generateSlots(
      doctor.start_time as string,
      doctor.end_time as string,
      doctor.slot_minutes as number,
      bookedSlots,
    );
  }, [doctor, bookedSlots, date]);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: user.id,
        doctor_id: doctorId,
        department_id: departmentId,
        appointment_date: date,
        slot_time: slot,
        symptoms,
        ...(await generateToken(departmentId, doctorId, date)),
      } as any)
      .select("*, departments(name, code)")
      .single();
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    setConfirmed(data);
    setBusy(false);
    toast.success(t("book_app_success_toast"));
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="mt-2 text-2xl">{t("book_app_confirmed_title")}</CardTitle>
            <CardDescription>
              {t("book_app_confirmed_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
              <div className="text-xs uppercase text-muted-foreground">{t("book_app_your_token")}</div>
              <div className="mt-1 font-mono text-5xl font-bold text-primary">
                {confirmed.token_code}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left text-sm">
              <Info label={t("book_app_dept_lbl")} value={t("dept_name_" + confirmed.departments?.name)} />
              <Info label={t("book_app_summary_date")} value={confirmed.appointment_date} />
              <Info label={t("book_app_summary_slot")} value={String(confirmed.slot_time).slice(0, 5)} />
              <Info label={t("book_app_summary_status")} value={t("status_waiting")} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate({ to: "/patient/queue" })} className="flex-1">
                {t("book_app_view_live_btn")}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/patient/appointments" })}
                className="flex-1"
              >
                {t("book_app_my_appts_btn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("book_app_title")}</h1>
        <p className="text-muted-foreground">{t("book_app_step", { step })}</p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded ${n <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
      
      {selectedHospital && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
          <img src={selectedHospital.imageUrl} alt={t(selectedHospital.name)} className="w-16 h-16 rounded-lg object-cover shadow-sm hidden sm:block" />
          <div>
            <h2 className="font-bold text-lg text-amber-900">{t(selectedHospital.name)}</h2>
            <p className="text-sm text-amber-800">{t(selectedHospital.address)}</p>
            <div className="mt-2 text-xs font-semibold text-amber-700 bg-amber-200/50 inline-block px-2 py-1 rounded">
              {t("book_app_selected_hosp")}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          {step === 1 && (
            <div className="space-y-3">
              <Label>{t("book_app_dept_lbl")}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {departments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDepartmentId(d.id);
                      setStep(2);
                    }}
                    className={`rounded-lg border p-4 text-left transition hover:border-primary ${departmentId === d.id ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t("dept_name_" + d.name)}</span>
                      <Badge variant="outline" className="font-mono">
                        {d.code}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{t("dept_desc_" + d.name)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <Label>{t("book_app_doctor_lbl")}</Label>
              {doctors.length === 0 && (
                <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
                  {t("book_app_no_docs")}
                </div>
              )}
              <div className="grid gap-2">
                {doctors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDoctorId(d.id);
                      setStep(3);
                    }}
                    className={`rounded-lg border p-3 text-left hover:border-primary ${doctorId === d.id ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="font-semibold">Dr. {d.profiles?.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.specialization} · {String(d.start_time).slice(0, 5)}–
                      {String(d.end_time).slice(0, 5)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <Label>{t("book_app_date_lbl")}</Label>
              <Input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Button onClick={() => setStep(4)} disabled={!date}>
                {t("book_app_next_btn")}
              </Button>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <Label>{t("book_app_slots_lbl")}</Label>
              {slots.length === 0 ? (
                <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
                  {t("book_app_doc_unavailable")}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSlot(s);
                        setStep(5);
                      }}
                      className={`rounded-md border px-2 py-2 text-sm hover:border-primary ${slot === s ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      {s.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {step === 5 && (
            <div className="space-y-3">
              <Label>{t("book_app_symptoms_lbl")}</Label>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                placeholder={t("book_app_symptoms_placeholder")}
              />
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="font-medium">{t("book_app_summary_lbl")}</div>
                <div className="mt-1 text-muted-foreground">
                  {t("dept_name_" + departments.find((d) => d.id === departmentId)?.name)} · Dr.{" "}
                  {doctor?.profiles?.full_name} · {date} · {slot.slice(0, 5)}
                </div>
              </div>
              <Button onClick={submit} disabled={busy} className="w-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CalIcon className="mr-1 h-4 w-4" /> {t("book_app_confirm_btn")}
              </Button>
            </div>
          )}
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              {t("book_app_back_btn")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
