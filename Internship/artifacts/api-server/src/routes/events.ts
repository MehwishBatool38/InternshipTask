import { Router, type IRouter } from "express";
import { and, asc, desc, count, eq, gt, sql } from "drizzle-orm";
import { db, eventsTable, registrationsTable } from "@workspace/db";
import {
  ListEventsQueryParams,
  CreateEventBody,
  GetEventParams,
  GetEventsSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseEventId(raw: unknown): number | null {
  const str = Array.isArray(raw) ? raw[0] : raw;
  const id = parseInt(String(str), 10);
  return isNaN(id) ? null : id;
}

async function buildEventResponse(event: typeof eventsTable.$inferSelect) {
  const [regResult] = await db
    .select({ count: count() })
    .from(registrationsTable)
    .where(and(eq(registrationsTable.eventId, event.id), eq(registrationsTable.status, "active")));
  const totalRegistrations = Number(regResult?.count ?? 0);
  return {
    id: event.id,
    name: event.name,
    description: event.description ?? null,
    totalSeats: event.totalSeats,
    availableSeats: event.availableSeats,
    totalRegistrations,
    eventDate: event.eventDate.toISOString(),
    createdAt: event.createdAt.toISOString(),
  };
}

router.get("/events/stats/summary", async (_req, res): Promise<void> => {
  const now = new Date();

  const [totalEventsResult] = await db.select({ count: count() }).from(eventsTable);
  const [upcomingEventsResult] = await db
    .select({ count: count() })
    .from(eventsTable)
    .where(gt(eventsTable.eventDate, now));
  const [totalRegsResult] = await db
    .select({ count: count() })
    .from(registrationsTable)
    .where(eq(registrationsTable.status, "active"));
  const [availSeatsResult] = await db
    .select({ total: sql<number>`SUM(available_seats)` })
    .from(eventsTable);

  const summary = {
    totalEvents: Number(totalEventsResult?.count ?? 0),
    upcomingEvents: Number(upcomingEventsResult?.count ?? 0),
    totalRegistrations: Number(totalRegsResult?.count ?? 0),
    totalAvailableSeats: Number(availSeatsResult?.total ?? 0),
  };

  res.json(GetEventsSummaryResponse.parse(summary));
});

router.get("/events", async (req, res): Promise<void> => {
  const parsed = ListEventsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { upcoming, sortBy, sortOrder } = parsed.data;
  const now = new Date();

  const conditions = [];
  if (upcoming === true) {
    conditions.push(gt(eventsTable.eventDate, now));
  }

  const orderDir = sortOrder === "desc" ? desc : asc;
  const orderCol = sortBy === "name" ? eventsTable.name : eventsTable.eventDate;

  const events = await db
    .select()
    .from(eventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderDir(orderCol));

  const result = await Promise.all(events.map(buildEventResponse));
  res.json(result);
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = firstIssue?.path?.join(".") ?? "input";
    const msg = firstIssue?.message ?? "Invalid input";
    res.status(400).json({ error: `${field}: ${msg}` });
    return;
  }

  const { name, description, totalSeats, eventDate } = parsed.data;

  const eventDateObj = new Date(eventDate);
  if (eventDateObj <= new Date()) {
    res.status(400).json({ error: "Event date must be in the future" });
    return;
  }

  if (totalSeats < 1) {
    res.status(400).json({ error: "Total seats must be greater than 0" });
    return;
  }

  const existing = await db
    .select({ id: eventsTable.id })
    .from(eventsTable)
    .where(eq(eventsTable.name, name));
  if (existing.length > 0) {
    res.status(409).json({ error: "An event with this name already exists" });
    return;
  }

  const [event] = await db
    .insert(eventsTable)
    .values({
      name,
      description: description ?? null,
      totalSeats,
      availableSeats: totalSeats,
      eventDate: eventDateObj,
    })
    .returning();

  res.status(201).json(await buildEventResponse(event));
});

router.get("/events/:eventId", async (req, res): Promise<void> => {
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, params.data.eventId));

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(await buildEventResponse(event));
});

export default router;
