import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar as CalendarIcon, Plus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Events", href: "/events", icon: CalendarIcon },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-6">
            <div className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs leading-none tracking-tighter">E</span>
              </div>
              EventBase
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || (location.startsWith('/events') && item.href === '/events' && location !== '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  data-testid={`link-nav-${item.name.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-2">
            <Link
              href="/events/new"
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              data-testid="link-nav-create-event"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-sidebar-foreground/60">
            <Activity className="w-3.5 h-3.5" />
            System Status: 
            {isError ? (
              <span className="text-destructive flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span> Offline</span>
            ) : health ? (
              <span className="text-primary flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span> {health.status}</span>
            ) : (
              <span>Checking...</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
