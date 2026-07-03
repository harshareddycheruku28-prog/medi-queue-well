import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGuard } from "@/components/role-guard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, PlayCircle, SkipForward } from "lucide-react";
import { StatusBadge } from "./patient.dashboard";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/doctor/queue")({
  component: () => (
    <RoleGuard role="doctor">
      <Page />
    </RoleGuard>
  ),
});

function Page() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data: doctor } = useQuery({
    queryKey: ["my-doctor", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("doctors").select("id").eq("profile_id", user!.id).maybeSingle()).data,
  });

  const { data: appts = [] } = useQuery({
    queryKey: ["dr-queue", doctor?.id, today],
    enabled: !!doctor,
    queryFn: async () =>
      (
        await supabase
          .from("appointments")
          .select("*, patient:profiles!appointments_patient_id_fkey(full_name, phone)")
          .eq("doctor_id", doctor!.id)
          .eq("appointment_date", today)
          .order("token_number")
      ).data ?? [],
  });

  useEffect(() => {
    if (!doctor) return;
    const ch = supabase
      .channel("dr-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${doctor.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["dr-queue"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [doctor, qc]);

  const update = async (id: string, status: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: status as any })
      .eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(t("dr_queue_marked_status", { status: t("status_" + status) }));
  };

  const callNext = async () => {
    const next = appts.find((a) => a.status === "waiting");
    if (!next) return toast.info(t("dr_queue_no_waiting"));
    await update(next.id, "in_progress");
  };

  const current = appts.find((a) => a.status === "in_progress");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("dr_queue_title")}</h1>
          <p className="text-muted-foreground">{t("dr_queue_subtitle")}</p>
        </div>
        <Button onClick={callNext}>
          <PlayCircle className="mr-2 h-4 w-4" /> {t("dr_queue_call_next")}
        </Button>
      </div>
      {current && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              {t("dr_queue_now_consulting")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-3xl font-bold text-primary">{current.token_code}</div>
              <div className="text-sm font-medium">{current.patient?.full_name}</div>
              <div className="text-xs text-muted-foreground">
                {current.patient?.phone} · slot {current.slot_time?.slice(0, 5)}
              </div>
              {current.symptoms && (
                <div className="mt-1 max-w-md text-xs text-muted-foreground">
                  "{current.symptoms}"
                </div>
              )}
            </div>
            <Button onClick={() => update(current.id, "completed")}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> {t("dr_queue_btn_complete")}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t("dr_queue_count_title", { count: appts.length })}</CardTitle>
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
                    <th className="p-2">{t("dr_queue_th_slot")}</th>
                    <th className="p-2">{t("dr_queue_th_status")}</th>
                    <th className="p-2">{t("dr_queue_th_actions")}</th>
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
                      <td className="p-2">
                        <div className="font-medium">{a.patient?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{a.patient?.phone}</div>
                      </td>
                      <td className="p-2">{a.slot_time?.slice(0, 5)}</td>
                      <td className="p-2">
                        <StatusBadge status={a.status as string} />
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {a.status === "waiting" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => update(a.id, "in_progress")}
                            >
                              <PlayCircle className="mr-1 h-3 w-3" /> {t("dr_queue_btn_call")}
                            </Button>
                          )}
                          {a.status === "waiting" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => update(a.id, "skipped")}
                            >
                              <SkipForward className="mr-1 h-3 w-3" /> {t("dr_queue_btn_skip")}
                            </Button>
                          )}
                          {(a.status === "in_progress" || a.status === "skipped") && (
                            <Button size="sm" onClick={() => update(a.id, "completed")}>
                              <CheckCircle2 className="mr-1 h-3 w-3" /> {t("dr_queue_btn_complete")}
                            </Button>
                          )}
                          {a.status === "skipped" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => update(a.id, "waiting")}
                            >
                              {t("dr_queue_btn_restore")}
                            </Button>
                          )}
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
    </div>
  );
}
