import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Calendar, Search, ArrowUpDown, Clock } from "lucide-react";
import { useListEvents, type ListEventsSortBy, type ListEventsSortOrder } from "@workspace/api-client-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function EventsPage() {
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<ListEventsSortBy>("date");
  const [sortOrder, setSortOrder] = useState<ListEventsSortOrder>("asc");
  const [search, setSearch] = useState("");

  const { data: events, isLoading } = useListEvents({
    upcoming: upcomingOnly ? true : undefined,
    sortBy,
    sortOrder,
  });

  const filteredEvents = events?.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">Manage and track your organization's events.</p>
        </div>
        <Button asChild>
          <Link href="/events/new" data-testid="link-create-event">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search events..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-events"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Switch 
              id="upcoming" 
              checked={upcomingOnly}
              onCheckedChange={setUpcomingOnly}
              data-testid="switch-upcoming-only"
            />
            <Label htmlFor="upcoming" className="text-sm font-medium cursor-pointer">Upcoming only</Label>
          </div>

          <div className="h-6 w-px bg-border hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as ListEventsSortBy)}>
              <SelectTrigger className="w-[130px] bg-background" data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              data-testid="btn-toggle-sort-order"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-full max-w-md" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="w-full sm:w-48 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredEvents?.length === 0 ? (
          <div className="text-center p-12 bg-card border border-dashed rounded-lg shadow-sm">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No events found</h3>
            <p className="text-muted-foreground mt-1 mb-6">
              {search || upcomingOnly ? "Try adjusting your filters" : "Get started by creating your first event"}
            </p>
            {(!search && !upcomingOnly) && (
              <Button asChild>
                <Link href="/events/new">Create Event</Link>
              </Button>
            )}
          </div>
        ) : (
          filteredEvents?.map((event) => {
            const isUpcoming = new Date(event.eventDate) > new Date();
            const fillPercentage = event.totalSeats > 0 ? (event.totalRegistrations / event.totalSeats) * 100 : 0;
            const isFull = event.availableSeats === 0;

            return (
              <Card key={event.id} className="overflow-hidden transition-all hover:shadow-md hover:border-primary/20 group">
                <Link href={`/events/${event.id}`} className="block p-6 focus:outline-none focus:bg-muted/50" data-testid={`link-event-${event.id}`}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                          {event.name}
                        </h2>
                        <div className="flex items-center gap-2">
                          {isUpcoming ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Upcoming</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Past</Badge>
                          )}
                          {isFull && <Badge variant="destructive">Full</Badge>}
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed max-w-3xl">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Calendar className="w-4 h-4 text-primary" />
                          {format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Clock className="w-4 h-4 text-primary" />
                          {format(new Date(event.eventDate), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-56 flex flex-col justify-center bg-muted/30 p-4 rounded-md border border-border/50">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-semibold text-foreground">Seats</span>
                        <span className="text-sm font-medium">
                          {event.totalRegistrations} / {event.totalSeats}
                        </span>
                      </div>
                      <Progress 
                        value={fillPercentage} 
                        className="h-2.5 bg-border" 
                        indicatorClassName={isFull ? "bg-destructive" : "bg-primary"}
                      />
                      <div className="mt-2 text-xs text-right text-muted-foreground font-medium">
                        {event.availableSeats} available
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
