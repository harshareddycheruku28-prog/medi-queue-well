import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/role-guard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/doctor/availability")({
  component: () => (
    <RoleGuard role="doctor">
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

function Page() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: doctor, refetch } = useQuery({
    queryKey: ["avail-doctor", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("doctors").select("*").eq("profile_id", user!.id).maybeSingle()).data,
  });

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotMinutes, setSlotMinutes] = useState(15);
  const [maxPatients, setMaxPatients] = useState(30);
  const [workingDays, setWorkingDays] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (doctor) {
      setStartTime(String(doctor.start_time).slice(0, 5));
      setEndTime(String(doctor.end_time).slice(0, 5));
      setSlotMinutes(doctor.slot_minutes);
      setMaxPatients(doctor.max_patients_per_day);
      setWorkingDays(doctor.working_days as number[]);
    }
  }, [doctor]);

  const save = async () => {
    if (!doctor) return;
    setBusy(true);
    const { error } = await supabase
      .from("doctors")
      .update({
        start_time: startTime,
        end_time: endTime,
        slot_minutes: slotMinutes,
        max_patients_per_day: maxPatients,
        working_days: workingDays,
      })
      .eq("id", doctor.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("dr_avail_success_toast"));
      refetch();
    }
  };

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  if (!doctor) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("dr_avail_title")}</h1>
        <p className="text-muted-foreground">{t("dr_avail_subtitle")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("dr_avail_shift_timing")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("dr_avail_start_time")}</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("dr_avail_end_time")}</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("dr_avail_slot_duration")}</Label>
              <Input
                type="number"
                min={5}
                max={120}
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(parseInt(e.target.value) || 15)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("dr_avail_max_patients")}</Label>
              <Input
                type="number"
                min={1}
                value={maxPatients}
                onChange={(e) => setMaxPatients(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("dr_avail_active_days")}</Label>
            <div className="flex flex-wrap gap-3">
              {DAYS.map(([name, val]) => (
                <div key={val} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`day-${val}`}
                    checked={workingDays.includes(val)}
                    onCheckedChange={() => toggleDay(val)}
                  />
                  <Label htmlFor={`day-${val}`} className="cursor-pointer">
                    {t(name)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={save} disabled={busy}>
            {t("dr_avail_save_btn")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
