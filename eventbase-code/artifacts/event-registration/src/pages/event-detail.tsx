import { useState } from "react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Users, UserPlus, XCircle, MoreVertical } from "lucide-react";
import { 
  useGetEvent, 
  getGetEventQueryKey,
  useListEventRegistrations, 
  getListEventRegistrationsQueryKey,
  useRegisterForEvent, 
  useCancelRegistration,
  getGetEventsSummaryQueryKey,
  getListEventsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newUserName, setNewUserName] = useState("");
  const [cancelingRegId, setCancelingRegId] = useState<number | null>(null);

  const { data: event, isLoading: isLoadingEvent } = useGetEvent(eventId, { 
    query: { enabled: !!eventId, queryKey: getGetEventQueryKey(eventId) } 
  });
  
  const { data: registrations, isLoading: isLoadingRegs } = useListEventRegistrations(eventId, {
    query: { enabled: !!eventId, queryKey: getListEventRegistrationsQueryKey(eventId) }
  });

  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelRegistration();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !event) return;

    registerMutation.mutate(
      {
        eventId,
        data: { userName: newUserName.trim() }
      },
      {
        onSuccess: () => {
          setNewUserName("");
          toast({ title: "Registration successful" });
          queryClient.invalidateQueries({ queryKey: getListEventRegistrationsQueryKey(eventId) });
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
        },
        onError: (err) => {
          toast({ 
            variant: "destructive", 
            title: "Registration failed", 
            description: err.error 
          });
        }
      }
    );
  };

  const handleCancelRegistration = () => {
    if (!cancelingRegId) return;

    cancelMutation.mutate(
      { registrationId: cancelingRegId },
      {
        onSuccess: () => {
          toast({ title: "Registration cancelled" });
          queryClient.invalidateQueries({ queryKey: getListEventRegistrationsQueryKey(eventId) });
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
          setCancelingRegId(null);
        },
        onError: (err) => {
          toast({ 
            variant: "destructive", 
            title: "Failed to cancel", 
            description: err.error 
          });
          setCancelingRegId(null);
        }
      }
    );
  };

  if (isLoadingEvent) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">Event not found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The event you are looking for does not exist or has been removed.</p>
        <Button asChild><Link href="/events">Return to Events</Link></Button>
      </div>
    );
  }

  const isUpcoming = new Date(event.eventDate) > new Date();
  const fillPercentage = event.totalSeats > 0 ? (event.totalRegistrations / event.totalSeats) * 100 : 0;
  const isFull = event.availableSeats === 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3 text-muted-foreground">
          <Link href="/events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
              {isUpcoming ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Upcoming</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Past</Badge>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground mt-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                {format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {format(new Date(event.eventDate), 'h:mm a')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>About this Event</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {event.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registrations</CardTitle>
                <CardDescription>People attending this event.</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {event.totalRegistrations} Registered
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoadingRegs ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : registrations?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                  No one has registered yet.
                </div>
              ) : (
                <div className="divide-y divide-border border rounded-md overflow-hidden">
                  {registrations?.map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between p-4 bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                          {reg.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-none">{reg.userName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Registered {format(new Date(reg.registeredAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setCancelingRegId(reg.id)}
                            data-testid={`btn-cancel-reg-${reg.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Registration
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Filled</span>
                  <span className="text-2xl font-bold tracking-tight">
                    {event.totalRegistrations} <span className="text-sm font-normal text-muted-foreground">/ {event.totalSeats}</span>
                  </span>
                </div>
                <Progress 
                  value={fillPercentage} 
                  className="h-3 bg-muted" 
                  indicatorClassName={isFull ? "bg-destructive" : "bg-primary"}
                />
                <div className="mt-2 text-sm text-right font-medium">
                  {isFull ? (
                    <span className="text-destructive font-semibold">Event is full</span>
                  ) : (
                    <span className="text-primary font-semibold">{event.availableSeats} seats remaining</span>
                  )}
                </div>
              </div>

              {!isFull && isUpcoming && (
                <div className="pt-6 border-t border-border">
                  <h3 className="font-semibold text-sm mb-3">Add Registration</h3>
                  <form onSubmit={handleRegister} className="space-y-3">
                    <Input 
                      placeholder="Attendee Name" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      disabled={registerMutation.isPending}
                      data-testid="input-attendee-name"
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={!newUserName.trim() || registerMutation.isPending}
                      data-testid="btn-submit-registration"
                    >
                      {registerMutation.isPending ? "Registering..." : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Register Attendee
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!cancelingRegId} onOpenChange={(open) => !open && setCancelingRegId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this registration? This will free up a seat for this event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleCancelRegistration(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? "Canceling..." : "Yes, Cancel Registration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
