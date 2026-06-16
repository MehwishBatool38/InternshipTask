import { useGetEventsSummary, useListEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";
import { Users, Calendar, CheckCircle, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetEventsSummary();
  const { data: upcomingEvents, isLoading: isLoadingEvents } = useListEvents({ upcoming: true, sortBy: 'date', sortOrder: 'asc' });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time metrics for your events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Events" 
          value={summary?.totalEvents} 
          isLoading={isLoadingSummary} 
          icon={Calendar} 
        />
        <MetricCard 
          title="Upcoming Events" 
          value={summary?.upcomingEvents} 
          isLoading={isLoadingSummary} 
          icon={Target} 
        />
        <MetricCard 
          title="Total Registrations" 
          value={summary?.totalRegistrations} 
          isLoading={isLoadingSummary} 
          icon={Users} 
        />
        <MetricCard 
          title="Available Seats" 
          value={summary?.totalAvailableSeats} 
          isLoading={isLoadingSummary} 
          icon={CheckCircle} 
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Upcoming Events</h2>
          <Link href="/events" className="text-sm font-medium text-primary hover:underline" data-testid="link-view-all-events">
            View all
          </Link>
        </div>

        <Card>
          <div className="divide-y divide-border">
            {isLoadingEvents ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))
            ) : upcomingEvents?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No upcoming events.
              </div>
            ) : (
              upcomingEvents?.slice(0, 5).map((event) => {
                const fillPercentage = event.totalSeats > 0 ? (event.totalRegistrations / event.totalSeats) * 100 : 0;
                
                return (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.id}`}
                    className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors block"
                    data-testid={`link-event-${event.id}`}
                  >
                    <div>
                      <h3 className="font-medium text-foreground">{event.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(event.eventDate), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">{event.totalRegistrations} / {event.totalSeats}</div>
                        <div className="text-xs text-muted-foreground">Seats filled</div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, isLoading, icon: Icon }: { title: string, value?: number, isLoading: boolean, icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value?.toLocaleString() || 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
