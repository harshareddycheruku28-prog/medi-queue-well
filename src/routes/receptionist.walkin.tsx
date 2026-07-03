import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/role-guard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { generateSlots, dayOfWeekIso } from "@/lib/slots";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/receptionist/walkin")({
  component: () => (
    <RoleGuard role="receptionist">
      <Page />
    </RoleGuard>
  ),
});

function Page() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [isNew, setIsNew] = useState(false);
  const { t } = useTranslation();

  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<any>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ["recep-depts"],
    queryFn: async () => (await supabase.from("departments").select("*").order("name")).data ?? [],
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["recep-docs", departmentId],
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
    queryKey: ["booked-recep", doctorId, date],
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

  const searchPatient = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("phone", phone.trim())
      .eq("role", "patient")
      .maybeSingle();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setPatientId(data.id);
      setFullName(data.full_name ?? "");
      setIsNew(false);
      setStep(2);
      toast.success(t("recep_walkin_registered"));
    } else {
      setIsNew(true);
      setFullName("");
      toast.info(t("recep_walkin_new_form"));
    }
  };

  const registerAndBook = async () => {
    setBusy(true);
    let finalPatientId = patientId;

    if (isNew) {
      const email = `walkin.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@mediqueue.local`;
      const password = Math.random().toString(36).slice(-12);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone, role: "patient" } },
      });
      if (error) {
        toast.error(error.message);
        setBusy(false);
        return;
      }
      if (data.user) {
        finalPatientId = data.user.id;
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .insert({
        patient_id: finalPatientId,
        doctor_id: doctorId,
        department_id: departmentId,
        appointment_date: date,
        slot_time: slot,
        symptoms,
        token_number: 0,
        token_code: "",
      } as any)
      .select("*, departments(name), doctors(profiles:profile_id(full_name))")
      .single();

    setBusy(false);
    if (apptError) {
      toast.error(apptError.message);
      return;
    }

    setConfirmed(appt);
    toast.success(t("recep_walkin_success_toast"));
  };

  const reset = () => {
    setStep(1);
    setPhone("");
    setFullName("");
    setPatientId("");
    setIsNew(false);
    setDepartmentId("");
    setDoctorId("");
    setSlot("");
    setSymptoms("");
    setConfirmed(null);
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("recep_walkin_token_details")}</CardTitle>
            <CardDescription>{t("recep_walkin_token_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
              <div className="text-xs uppercase text-muted-foreground">{t("book_app_your_token")}</div>
              <div className="mt-1 font-mono text-5xl font-bold text-primary">
                {confirmed.token_code}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left text-sm">
              <div>
                <div className="text-xs text-muted-foreground">{t("dr_queue_th_patient")}</div>
                <div className="font-medium">{fullName}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("book_app_doctor_lbl")}</div>
                <div className="font-medium">Dr. {confirmed.doctors?.profiles?.full_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("book_app_dept_lbl")}</div>
                <div className="font-medium">{t("dept_name_" + confirmed.departments?.name)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("dr_queue_th_slot")}</div>
                <div className="font-medium">
                  {confirmed.appointment_date} · {confirmed.slot_time?.slice(0, 5)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => window.print()} className="flex-1" variant="outline">
                <Printer className="mr-2 h-4 w-4" /> {t("recep_walkin_print_btn")}
              </Button>
              <Button onClick={reset} className="flex-1">
                {t("recep_walkin_another_btn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("recep_walkin_title")}</h1>
        <p className="text-muted-foreground">{t("recep_walkin_subtitle")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 ? t("recep_walkin_step1") : t("recep_walkin_step2")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-1">
                <Label>{t("recep_walkin_phone")}</Label>
                <div className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    disabled={isNew}
                  />
                  {!isNew && (
                    <Button onClick={searchPatient} disabled={busy}>
                      {t("recep_walkin_btn_search")}
                    </Button>
                  )}
                </div>
              </div>
              {isNew && (
                <div className="space-y-3">
                  <div className="rounded bg-muted p-3 text-xs text-muted-foreground">
                    {t("recep_walkin_find_or_new")}
                  </div>
                  <div className="space-y-1">
                    <Label>{t("auth_label_fullname")}</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <Button onClick={() => setStep(2)} disabled={!fullName || !phone} className="w-full">
                    {t("book_app_next_btn")}
                  </Button>
                  <Button variant="ghost" onClick={reset} className="w-full">
                    {t("book_app_back_btn")}
                  </Button>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded bg-muted p-3 text-sm">
                <strong>{t("dr_queue_th_patient")}:</strong> {fullName} ({phone})
              </div>
              <div className="space-y-1">
                <Label>{t("book_app_dept_lbl")}</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
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

              {departmentId && (
                <div className="space-y-1">
                  <Label>{t("book_app_doctor_lbl")}</Label>
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("recep_walkin_select_doctor")} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          Dr. {d.profiles?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {doctorId && (
                <>
                  <div className="space-y-1">
                    <Label>{t("book_app_date_lbl")}</Label>
                    <Input
                      type="date"
                      min={today}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("book_app_slots_lbl")}</Label>
                    <Select value={slot} onValueChange={setSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("recep_walkin_select_slot")} />
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.slice(0, 5)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label>{t("book_app_symptoms_lbl")}</Label>
                <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  {t("book_app_back_btn")}
                </Button>
                <Button
                  onClick={registerAndBook}
                  disabled={busy || !doctorId || !slot}
                  className="flex-1"
                >
                  {t("recep_walkin_btn_submit")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
