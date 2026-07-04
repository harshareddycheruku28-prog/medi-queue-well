import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/role-guard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Stethoscope } from "lucide-react";
import { StatusBadge } from "./patient.dashboard";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/receptionist/dashboard")({
  component: () => (
    <RoleGuard role="receptionist">
      <Page />
    </RoleGuard>
  ),
});

function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const { t } = useTranslation();

  const { data: appts = [] } = useQuery({
    queryKey: ["recep-today", today],
    queryFn: async () =>
      (
        await supabase
          .from("appointments")
          .select(
            "*, patient:profiles!appointments_patient_id_fkey(full_name), doctor:doctors(profiles:profile_id(full_name))",
          )
          .eq("appointment_date", today)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const stats = {
    booked: appts.length,
    completed: appts.filter((a) => a.status === "completed").length,
    active: appts.filter((a) => a.status === "in_progress" || a.status === "waiting").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("recep_dash_title")}</h1>
          <p className="text-muted-foreground">{t("recep_dash_recent_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/receptionist/walkin">
              <UserPlus className="mr-2 h-4 w-4" /> {t("recep_dash_btn_walkin")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/receptionist/doctors">
              <Stethoscope className="mr-2 h-4 w-4" /> {t("recep_dash_btn_doctors")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/receptionist/search">
              <Search className="mr-2 h-4 w-4" /> {t("recep_dash_btn_search")}
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title={t("recep_dash_booked_count")} val={stats.booked} />
        <StatCard title={t("recep_dash_completed_count")} val={stats.completed} />
        <StatCard title={t("recep_dash_active_count")} val={stats.active} />
      </div>
      {/* Assign Doctor to Patient section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recep_dash_assign_doctor") ?? "Assign Doctor to Patient"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/receptionist/walkin">
                <UserPlus className="mr-2 h-4 w-4" /> {t("recep_dash_btn_walkin") ?? "Register Walk-in Patient"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("recep_dash_upcoming_appts")}</CardTitle>
        </CardHeader>
        <CardContent>
          {appts.length === 0 ? (
            <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
              {t("dr_queue_no_appts")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2">{t("dr_queue_th_token")}</th>
                    <th className="p-2">{t("dr_queue_th_patient")}</th>
                    <th className="p-2">{t("book_app_doctor_lbl")}</th>
                    <th className="p-2">{t("dr_queue_th_slot")}</th>
                    <th className="p-2">{t("dr_queue_th_status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {appts.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="p-2">
                        <Badge variant="outline" className="font-mono">
                          {a.token_code}
                        </Badge>
                      </td>
                      <td className="p-2 font-medium">{a.patient?.full_name}</td>
                      <td className="p-2">Dr. {a.doctor?.profiles?.full_name}</td>
                      <td className="p-2">{a.slot_time?.slice(0, 5)}</td>
                      <td className="p-2">
                        <StatusBadge status={a.status as string} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, val }: { title: string; val: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-1 text-3xl font-bold">{val}</div>
      </CardContent>
    </Card>
  );
}
