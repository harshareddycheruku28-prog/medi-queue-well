import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Stethoscope,
  User as UserIcon,
  UserPlus,
  Users,
  ChevronLeft,
  Hospital,
} from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n";

type NavItem = { to: string; labelKey: string; icon: typeof Home };

const navByRole: Record<Role, NavItem[]> = {
  patient: [
    { to: "/patient/dashboard", labelKey: "dashboard", icon: Home },
    { to: "/patient/find-hospital", labelKey: "find_hospital", icon: Hospital },
    { to: "/patient/symptom-checker", labelKey: "symptom_checker", icon: Stethoscope },
    { to: "/patient/book", labelKey: "bookAppointment", icon: Calendar },
    { to: "/patient/appointments", labelKey: "myAppointments", icon: Activity },
    { to: "/patient/queue", labelKey: "liveQueue", icon: Users },
    { to: "/patient/profile", labelKey: "profile", icon: UserIcon },
  ],
  receptionist: [
    { to: "/receptionist/dashboard", labelKey: "dashboard", icon: Home },
    { to: "/receptionist/walkin", labelKey: "walkin_title", icon: UserPlus },
    { to: "/receptionist/doctors", labelKey: "recep_docs_title", icon: Stethoscope },
    { to: "/receptionist/search", labelKey: "recep_search_title", icon: Search },
  ],
  doctor: [
    { to: "/doctor/dashboard", labelKey: "dashboard", icon: Home },
    { to: "/doctor/queue", labelKey: "dr_queue_title", icon: Users },
    { to: "/doctor/availability", labelKey: "dr_dash_btn_availability", icon: Settings },
  ],
};

const roleIcon: Record<Role, typeof Hospital> = {
  patient: UserIcon,
  receptionist: UserPlus,
  doctor: Stethoscope,
};

function SidebarBody({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = navByRole[role];
  const RoleIcon = roleIcon[role];
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <img src="/logo.png" alt="MediQueue Logo" className="h-9 w-9 object-contain rounded-lg" />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight">MediQueue</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <RoleIcon className="h-3 w-3" /> <span className="capitalize">{t(`auth_${role}_portal_title`)}</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(it.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 space-y-2">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
        >
          <Home className="h-4 w-4" /> {t("nav_public_home")}
        </Link>
        <div className="px-3 text-[10px] text-muted-foreground/60 font-medium">
          {t("nav_ai_students")}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };
  const crumbs = pathname.split("/").filter(Boolean);
  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <SidebarBody role={role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarBody role={role} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} title={t("nav_back")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <nav className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground sm:flex">
            <Link to="/" className="hover:text-foreground">
              {t("nav_home")}
            </Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <span>/</span>
                <span className={cn(i === crumbs.length - 1 && "font-medium text-foreground")}>
                  {c.replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" /> {t("nav_logout")}
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
