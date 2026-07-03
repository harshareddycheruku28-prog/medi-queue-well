import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGuard } from "@/components/role-guard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StatusBadge } from "./patient.dashboard";
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
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/patient/appointments")({
  component: () => (
    <RoleGuard role="patient">
      <Page />
    </RoleGuard>
  ),
});

function Page() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data: appts = [] } = useQuery({
    queryKey: ["all-appts", user?.id],
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
          .order("slot_time", { ascending: false })
      ).data ?? [],
  });

  const cancel = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("my_appts_cancelled_toast"));
      qc.invalidateQueries({ queryKey: ["all-appts"] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("my_appts_title")}</h1>
        <p className="text-muted-foreground">{t("my_appts_subtitle")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("my_appts_all")}</CardTitle>
        </CardHeader>
        <CardContent>
          {appts.length === 0 && (
            <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
              {t("my_appts_none")}
            </div>
          )}
          <div className="space-y-2">
            {appts.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-base">
                      {a.token_code}
                    </Badge>
                    <span className="font-semibold">{t("dept_name_" + a.departments?.name)}</span>
                    <StatusBadge status={a.status as string} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {a.appointment_date} · {a.slot_time?.slice(0, 5)} · Dr.{" "}
                    {a.doctors?.profiles?.full_name}
                  </div>
                  {a.symptoms && (
                    <div className="mt-1 text-xs text-muted-foreground">"{a.symptoms}"</div>
                  )}
                </div>
                {a.status === "waiting" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        {t("my_appts_cancel_btn")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("my_appts_cancel_confirm_title", { token: a.token_code })}</AlertDialogTitle>
                        <AlertDialogDescription>{t("my_appts_cancel_confirm_desc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("my_appts_cancel_keep")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => cancel(a.id)}>
                          {t("my_appts_cancel_confirm_btn")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
