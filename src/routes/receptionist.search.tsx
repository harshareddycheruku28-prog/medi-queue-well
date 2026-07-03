import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGuard } from "@/components/role-guard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./patient.dashboard";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/receptionist/search")({
  component: () => (
    <RoleGuard role="receptionist">
      <Page />
    </RoleGuard>
  ),
});

function Page() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const { t } = useTranslation();

  const { data: appointments = [] } = useQuery({
    queryKey: ["recep-search", q, status],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(
          "*, patient:profiles!appointments_patient_id_fkey(full_name, phone), doctor:doctors(profiles:profile_id(full_name))",
        )
        .order("appointment_date", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data } = await query;
      const list = data ?? [];

      if (!q.trim()) return list;

      const norm = q.toLowerCase();
      return list.filter(
        (a) =>
          a.token_code?.toLowerCase().includes(norm) ||
          a.patient?.full_name?.toLowerCase().includes(norm) ||
          a.patient?.phone?.toLowerCase().includes(norm) ||
          a.doctor?.profiles?.full_name?.toLowerCase().includes(norm),
      );
    },
  });

  const cancel = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("my_appts_cancelled_toast"));
      qc.invalidateQueries({ queryKey: ["recep-search"] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("recep_search_title")}</h1>
        <p className="text-muted-foreground">{t("recep_search_subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("recep_search_placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("dr_queue_th_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("recep_search_all")}</SelectItem>
            <SelectItem value="waiting">{t("status_waiting")}</SelectItem>
            <SelectItem value="in_progress">{t("status_in_progress")}</SelectItem>
            <SelectItem value="completed">{t("status_completed")}</SelectItem>
            <SelectItem value="skipped">{t("status_skipped")}</SelectItem>
            <SelectItem value="cancelled">{t("status_cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {appointments.length === 0 ? (
            <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
              {t("find_hosp_none_found")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2">{t("dr_queue_th_token")}</th>
                    <th className="p-2">{t("dr_queue_th_patient")}</th>
                    <th className="p-2">{t("book_app_doctor_lbl")}</th>
                    <th className="p-2">{t("recep_search_th_date_slot")}</th>
                    <th className="p-2">{t("dr_queue_th_status")}</th>
                    <th className="p-2 text-right">{t("dr_queue_th_actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="p-2 font-mono">
                        <Badge variant="outline">{a.token_code}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{a.patient?.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.patient?.phone}
                        </div>
                      </td>
                      <td className="p-2">Dr. {a.doctor?.profiles?.full_name}</td>
                      <td className="p-2">
                        {a.appointment_date} · {a.slot_time?.slice(0, 5)}
                      </td>
                      <td className="p-2">
                        <StatusBadge status={a.status as string} />
                      </td>
                      <td className="p-2 text-right">
                        {a.status === "waiting" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancel(a.id)}
                          >
                            {t("my_appts_cancel_btn")}
                          </Button>
                        )}
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
