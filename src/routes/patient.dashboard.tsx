import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Calendar, Clock, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/role-guard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/patient/dashboard")({
  component: () => (
    <RoleGuard role="patient">
      <Page />
    </RoleGuard>
  ),
});

function Page() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const { t } = useTranslation();

  const { data: appts = [] } = useQuery({
    queryKey: ["my-appts", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("appointments")
          .select(
            "*, departments(name, code), doctors(specialization, profiles:profile_id(full_name))",
          )
          .eq("patient_id", user!.id)
          .order("appointment_date", { ascending: false })
          .limit(5)
      ).data ?? [],
  });
  const upcoming = appts.filter(
    (a) => a.appointment_date >= today && a.status !== "cancelled" && a.status !== "completed",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("patient_dash_welcome")}</h1>
        <p className="text-muted-foreground">{t("patient_dash_subtitle")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-orange-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-orange-700 text-xl">{t("patient_dash_symptom_card_title")}</CardTitle>
            <CardDescription className="text-orange-800/70">{t("patient_dash_symptom_card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md">
              <Link to="/patient/symptom-checker">{t("patient_dash_symptom_card_btn")}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-500/10 to-emerald-600/10 border-teal-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-teal-700 text-xl">{t("patient_dash_find_card_title")}</CardTitle>
            <CardDescription className="text-teal-800/70">{t("patient_dash_find_card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md">
              <Link to="/patient/find-hospital">{t("patient_dash_find_card_btn")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Calendar} label={t("patient_dash_upcoming")} value={upcoming.length} />
        <StatCard icon={Activity} label={t("patient_dash_total_visits")} value={appts.length} />
        <StatCard
          icon={Clock}
          label={t("patient_dash_next_slot")}
          value={upcoming[0]?.slot_time?.slice(0, 5) ?? "—"}
        />
        <StatCard icon={Users} label={t("patient_dash_active_token")} value={upcoming[0]?.token_code ?? "—"} mono />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("patient_dash_recent_appts")}</CardTitle>
              <CardDescription>{t("patient_dash_last_5")}</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link to="/patient/appointments">{t("patient_dash_view_all")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {appts.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("my_appts_none")}{" "}
                <Link to="/patient/book" className="text-primary underline">
                  {t("patient_dash_book_now")}
                </Link>
              </div>
            )}
            {appts.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {a.token_code}
                    </Badge>
                    <span className="font-medium">{t("dept_name_" + a.departments?.name)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.appointment_date} · {a.slot_time?.slice(0, 5)} · Dr.{" "}
                    {a.doctors?.profiles?.full_name}
                  </div>
                </div>
                <StatusBadge status={a.status as string} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("patient_dash_quick_actions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/patient/symptom-checker">
                <Activity className="mr-2 h-4 w-4" /> {t("patient_dash_symptom_checker")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/patient/queue">
                <Users className="mr-2 h-4 w-4" /> {t("patient_dash_live_queue")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/patient/profile">{t("patient_dash_update_profile")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any;
  label: string;
  value: any;
  mono?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`text-xl font-bold ${mono ? "font-mono" : ""}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { labelKey: string; cls: string }> = {
    waiting: { labelKey: "status_waiting", cls: "bg-warning/15 text-warning-foreground border-warning/30" },
    in_progress: { labelKey: "status_in_progress", cls: "bg-primary/15 text-primary border-primary/30" },
    completed: { labelKey: "status_completed", cls: "bg-success/15 text-success border-success/30" },
    skipped: { labelKey: "status_skipped", cls: "bg-muted text-muted-foreground" },
    cancelled: {
      labelKey: "status_cancelled",
      cls: "bg-destructive/10 text-destructive border-destructive/30",
    },
  };
  const m = map[status] ?? { labelKey: status, cls: "" };
  return (
    <Badge variant="outline" className={m.cls}>
      {t(m.labelKey)}
    </Badge>
  );
}
