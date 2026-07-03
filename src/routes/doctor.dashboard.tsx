import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/role-guard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, Activity } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/doctor/dashboard")({
  component: () => (
    <RoleGuard role="doctor">
      <Page />
    </RoleGuard>
  ),
});

function Page() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const { t } = useTranslation();

  const { data: doctor } = useQuery({
    queryKey: ["my-doctor", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("doctors")
          .select("*, departments(name, code)")
          .eq("profile_id", user!.id)
          .maybeSingle()
      ).data,
  });
  const { data: appts = [] } = useQuery({
    queryKey: ["dr-today-stats", doctor?.id, today],
    enabled: !!doctor,
    queryFn: async () =>
      (
        await supabase
          .from("appointments")
          .select("status")
          .eq("doctor_id", doctor!.id)
          .eq("appointment_date", today)
      ).data ?? [],
  });

  if (!doctor)
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        {t("dr_dash_profile_missing")}
      </div>
    );

  const counts = {
    total: appts.length,
    waiting: appts.filter((a) => a.status === "waiting").length,
    completed: appts.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("dr_dash_title")}</h1>
          <p className="text-muted-foreground">
            {t("dept_name_" + doctor.departments?.name)} · {doctor.specialization}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/doctor/queue">
              <Users className="mr-2 h-4 w-4" /> {t("dr_dash_btn_queue")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/doctor/availability">
              <Settings className="mr-2 h-4 w-4" /> {t("dr_dash_btn_availability")}
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("dr_dash_today_total")} v={counts.total} />
        <Stat label={t("dr_dash_waiting")} v={counts.waiting} />
        <Stat label={t("dr_dash_completed")} v={counts.completed} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> {t("dr_dash_working_hours")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Info
            l={t("dr_dash_hours")}
            v={`${String(doctor.start_time).slice(0, 5)} – ${String(doctor.end_time).slice(0, 5)}`}
          />
          <Info l={t("dr_dash_slot_length")} v={`${doctor.slot_minutes} min`} />
          <Info l={t("dr_dash_max_patients")} v={String(doctor.max_patients_per_day)} />
          <Info
            l={t("dr_dash_working_days")}
            v={(doctor.working_days as number[])
              .map((d) => t(["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]))
              .join(", ")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{v}</div>
      </CardContent>
    </Card>
  );
}
function Info({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{l}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
