import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hospital, Stethoscope, User as UserIcon, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, rolePath, type Role } from "@/lib/auth";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/auth/$role")({
  validateSearch: (s: Record<string, unknown>): { tab?: "login" | "signup" } => ({
    tab: s.tab === "signup" ? "signup" : s.tab === "login" ? "login" : undefined,
  }),
  component: AuthPage,
});

const VALID_ROLES: Role[] = ["patient", "receptionist", "doctor"];
const roleMeta = {
  patient: { icon: UserIcon, titleKey: "auth_patient_portal_title", descKey: "auth_patient_portal_desc" },
  receptionist: {
    icon: UserPlus,
    titleKey: "auth_receptionist_portal_title",
    descKey: "auth_receptionist_portal_desc",
  },
  doctor: { icon: Stethoscope, titleKey: "auth_doctor_portal_title", descKey: "auth_doctor_portal_desc" },
};

function AuthPage() {
  const { role } = useParams({ from: "/auth/$role" });
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, role: userRole, loading, refreshRole } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(search.tab || "login");
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  const safeRole = (VALID_ROLES.includes(role as Role) ? role : "patient") as Role;
  const Meta = roleMeta[safeRole];

  useEffect(() => {
    if (!loading && user && userRole) {
      navigate({ to: rolePath[userRole] });
    }
  }, [user, userRole, loading, navigate]);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-list"],
    queryFn: async () => (await supabase.from("departments").select("*").order("name")).data ?? [],
    enabled: safeRole === "doctor" && tab === "signup",
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    await refreshRole();
    toast.success(t("auth_success_welcome"));
    setBusy(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    const full_name = String(f.get("full_name"));
    const phone = String(f.get("phone") ?? "");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name, phone, role: safeRole },
      },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }

    if (safeRole === "doctor" && data.user) {
      const department_id = String(f.get("department_id"));
      const specialization = String(f.get("specialization") ?? "");
      setTimeout(async () => {
        await supabase.from("doctors").insert({
          profile_id: data.user!.id,
          department_id,
          specialization,
        });
      }, 800);
    }

    toast.success(t("auth_success_created"));
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div
        className="relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="MediQueue Logo"
            className="h-8 w-8 object-contain rounded-lg bg-white/10 p-0.5"
          />
          <span className="text-lg font-bold">MediQueue</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight text-primary-foreground">{t(Meta.titleKey)}</h2>
          <p className="mt-2 max-w-md text-lg text-primary-foreground opacity-90">{t(Meta.descKey)}</p>
        </div>
        <div>
          <p className="text-sm opacity-70">© {new Date().getFullYear()} {t("footer_hospital_name")}</p>
          <p className="mt-1 text-xs opacity-50 font-medium">{t("footer_ai_students")}</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Meta.icon className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">{t(Meta.titleKey)}</CardTitle>
            <CardDescription>{t(Meta.descKey)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("auth_tab_login")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth_tab_signup")}</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1">
                    <Label>{t("auth_label_email")}</Label>
                    <Input name="email" type="email" required />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("auth_label_password")}</Label>
                    <Input name="password" type="password" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("auth_tab_login")}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-1">
                    <Label>{t("auth_label_fullname")}</Label>
                    <Input name="full_name" required />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("auth_label_phone")}</Label>
                    <Input name="phone" />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("auth_label_email")}</Label>
                    <Input name="email" type="email" required />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("auth_label_password")}</Label>
                    <Input name="password" type="password" required minLength={6} />
                  </div>
                  {safeRole === "doctor" && (
                    <>
                      <div className="space-y-1">
                        <Label>{t("auth_label_department")}</Label>
                        <Select name="department_id" required>
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
                        <Input
                          name="specialization"
                          placeholder={t("auth_placeholder_spec")}
                        />
                      </div>
                    </>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("auth_btn_create_account")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              {VALID_ROLES.filter((r) => r !== safeRole).map((r) => (
                <Link key={r} to="/auth/$role" params={{ role: r }} className="hover:text-primary">
                  {t("auth_link_" + r + "_login")}
                </Link>
              ))}
              <Link to="/" className="hover:text-primary">
                {t("auth_link_back_to_home")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
