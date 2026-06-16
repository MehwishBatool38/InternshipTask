import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useCreateEvent, getListEventsQueryKey, getGetEventsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100),
  description: z.string().max(1000).optional(),
  totalSeats: z.coerce.number().min(1, "Must have at least 1 seat"),
  eventDate: z.date({ required_error: "Event date is required" }),
  eventTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be a valid time (HH:MM)"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewEventPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      totalSeats: 50,
      eventTime: "12:00",
    },
  });

  const createEvent = useCreateEvent();

  const onSubmit = (values: FormValues) => {
    // Combine date and time
    const [hours, minutes] = values.eventTime.split(':').map(Number);
    const eventDateTime = new Date(values.eventDate);
    eventDateTime.setHours(hours, minutes, 0, 0);

    createEvent.mutate(
      {
        data: {
          name: values.name,
          description: values.description || undefined,
          totalSeats: values.totalSeats,
          eventDate: eventDateTime.toISOString(),
        }
      },
      {
        onSuccess: (event) => {
          toast({
            title: "Event created",
            description: "Your event has been successfully created.",
          });
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
          setLocation(`/events/${event.id}`);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Failed to create event",
            description: error.error || "An unexpected error occurred.",
          });
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3 text-muted-foreground">
          <Link href="/events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground mt-1">Set up a new event and open registrations.</p>
      </div>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Provide the fundamental information about your gathering.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual Developer Conference" {...field} data-testid="input-event-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What is this event about?" 
                        className="resize-y min-h-[100px]"
                        {...field} 
                        data-testid="input-event-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-background",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="btn-select-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time (24h)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-event-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="totalSeats"
                render={({ field }) => (
                  <FormItem className="w-full md:w-1/2">
                    <FormLabel>Total Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} data-testid="input-event-seats" />
                    </FormControl>
                    <FormDescription>Maximum number of attendees allowed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" asChild>
                <Link href="/events">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createEvent.isPending} data-testid="btn-submit-event">
                {createEvent.isPending ? "Creating..." : "Create Event"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
