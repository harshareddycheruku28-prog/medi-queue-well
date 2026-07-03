import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  ChevronRight,
  Clock,
  Hospital,
  Stethoscope,
  Users,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, rolePath } from "@/lib/auth";
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/lib/i18n';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediQueue – Skip the Wait, Book Online" },
      {
        name: "description",
        content:
          "Modern hospital appointment booking with live queue updates. Book, get a token, and arrive when it's your turn.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, role } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const { t } = useTranslation();

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-with-stats", today],
    queryFn: async () => {
      const { data: depts } = await supabase.from("departments").select("*").order("name");
      const { data: appts } = await supabase
        .from("appointments")
        .select("department_id, status, token_number")
        .eq("appointment_date", today);
      const { data: docs } = await supabase.from("doctors").select("id, department_id");
      return (depts ?? []).map((d) => {
        const dAppts = (appts ?? []).filter((a) => a.department_id === d.id);
        const current = dAppts.find((a) => a.status === "in_progress");
        return {
          ...d,
          current_token: current ? current.token_number : 0,
          doctor_count: (docs ?? []).filter((x) => x.department_id === d.id).length,
        };
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MediQueue Logo"
              className="h-8 w-8 object-contain rounded-lg"
            />
            <span className="text-lg font-bold tracking-tight">MediQueue</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#departments" className="text-muted-foreground hover:text-foreground">
              {t("nav_departments")}
            </a>
            <Link to="/queue" className="text-muted-foreground hover:text-foreground">
              {t("nav_live_queue")}
            </Link>
            <a href="#about" className="text-muted-foreground hover:text-foreground">
              {t("nav_about")}
            </a>
          </nav>
      <LanguageSelector />
          <div className="flex items-center gap-2">
            {user && role ? (
              <Button asChild size="sm">
                <Link to={rolePath[role]}>{t("nav_dashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth/$role" params={{ role: "patient" }}>
                    {t("nav_patient_login")}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth/$role" params={{ role: "patient" }} search={{ tab: "signup" }}>
                    {t("nav_signup")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 text-black sm:py-28">
          <Badge variant="secondary" className="mb-4 bg-white/70 text-black border-black/10">
            <ShieldCheck className="mr-1 h-3 w-3" /> {t("hero_trusted_badge")}
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-black sm:text-6xl">
            {t("hero_title_skip_wait")} <span className="opacity-90">{t("hero_title_arrive_turn")}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-black opacity-90">
            {t("hero_description")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/patient/book">
                <Calendar className="mr-2 h-4 w-4" /> {t("hero_btn_book")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-black/30 bg-white/60 text-black hover:bg-white/80"
            >
              <Link to="/queue">
                <Users className="mr-2 h-4 w-4" /> {t("hero_btn_view_queue")}
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { labelKey: "hero_stat_wait_saved", value: "42m" },
              { labelKey: "hero_stat_departments", value: "5" },
              { labelKey: "hero_stat_daily_tokens", value: "300+" },
              { labelKey: "hero_stat_realtime", value: t("hero_stat_live") },
            ].map((s) => (
              <div key={s.labelKey} className="text-black">
                <div className="text-3xl font-bold text-black">{s.value}</div>
                <div className="text-sm text-black opacity-80">{t(s.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Calendar,
              titleKey: "about_book_title",
              descKey: "about_book_desc",
            },
            {
              icon: Activity,
              titleKey: "about_live_title",
              descKey: "about_live_desc",
            },
            {
              icon: Stethoscope,
              titleKey: "about_doctor_title",
              descKey: "about_doctor_desc",
            },
          ].map((f) => (
            <div key={f.titleKey} className="rounded-xl border border-border bg-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-lg font-semibold">{t(f.titleKey)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">{t("departments_title")}</h2>
              <p className="mt-1 text-muted-foreground">
                {t("departments_subtitle")}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/queue">
                {t("departments_btn_full_queue")} <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <Card key={d.id} className="group transition hover:-translate-y-0.5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono">
                      {d.code}
                    </Badge>
                    <Stethoscope className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="mt-2">{t("dept_name_" + d.name)}</CardTitle>
                  <CardDescription>{t("dept_desc_" + d.name)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-xs text-muted-foreground">{t("dept_current")}</div>
                      <div className="text-lg font-bold text-primary">{d.current_token || "—"}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-xs text-muted-foreground">{t("dept_avg_wait")}</div>
                      <div className="text-lg font-bold">{d.avg_wait_minutes}m</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-xs text-muted-foreground">{t("dept_doctors")}</div>
                      <div className="text-lg font-bold">{d.doctor_count}</div>
                    </div>
                  </div>
                  <Button asChild className="mt-4 w-full" size="sm">
                    <Link to="/patient/book">{t("book_dept", { name: t("dept_name_" + d.name) })}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live preview */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{t("live_preview_title")}</h2>
              <p className="text-muted-foreground">{t("live_preview_subtitle")}</p>
            </div>
            <Button asChild>
              <Link to="/queue">
                <Clock className="mr-2 h-4 w-4" /> {t("live_preview_btn_open")}
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {departments.map((d) => (
              <div key={d.id} className="rounded-lg border border-border p-4">
                <div className="text-xs font-medium text-muted-foreground">{t("dept_name_" + d.name)}</div>
                <div className="mt-1 font-mono text-2xl font-bold text-primary">
                  {d.code}-{String(d.current_token || 0).padStart(3, "0")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t("live_now_serving")}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff portals */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">{t("staff_portals_title")}</h2>
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
            {[
              {
                role: "patient" as const,
                icon: UserPlus,
                titleKey: "portal_patient_login",
                descKey: "portal_patient_desc",
              },
              {
                role: "receptionist" as const,
                icon: Hospital,
                titleKey: "portal_receptionist_login",
                descKey: "portal_receptionist_desc",
              },
              {
                role: "doctor" as const,
                icon: Stethoscope,
                titleKey: "portal_doctor_login",
                descKey: "portal_doctor_desc",
              },
            ].map((p) => (
              <Link
                key={p.role}
                to="/auth/$role"
                params={{ role: p.role }}
                className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold group-hover:text-primary">{t(p.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(p.descKey)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MediQueue Logo" className="h-5 w-5 object-contain" />
            <span>{t("footer_hospital_name")}</span>
          </div>
          <div className="text-right">
            <div>{t("footer_copyright", { year: new Date().getFullYear() })}</div>
            <div className="text-xs text-muted-foreground/80 mt-1 font-medium">
              {t("footer_ai_students")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
