import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, eventsTable, registrationsTable } from "@workspace/db";
import {
  ListEventRegistrationsParams,
  RegisterForEventParams,
  RegisterForEventBody,
  CancelRegistrationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events/:eventId/registrations", async (req, res): Promise<void> => {
  const params = ListEventRegistrationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .select({ id: eventsTable.id })
    .from(eventsTable)
    .where(eq(eventsTable.id, params.data.eventId));

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const registrations = await db
    .select()
    .from(registrationsTable)
    .where(
      and(
        eq(registrationsTable.eventId, params.data.eventId),
        eq(registrationsTable.status, "active"),
      ),
    )
    .orderBy(registrationsTable.registeredAt);

  res.json(
    registrations.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      userName: r.userName,
      status: r.status,
      registeredAt: r.registeredAt.toISOString(),
      cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
    })),
  );
});

router.post("/events/:eventId/registrations", async (req, res): Promise<void> => {
  const pathParams = RegisterForEventParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const body = RegisterForEventBody.safeParse(req.body);
  if (!body.success) {
    const firstIssue = body.error.issues[0];
    const field = firstIssue?.path?.join(".") ?? "input";
    const msg = firstIssue?.message ?? "Invalid input";
    res.status(400).json({ error: `${field}: ${msg}` });
    return;
  }

  const { eventId } = pathParams.data;
  const { userName } = body.data;

  await db.execute(`BEGIN`);

  try {
    const lockResult = await db.execute<{
      id: number;
      available_seats: number;
    }>(
      `SELECT id, available_seats FROM events WHERE id = ${eventId} FOR UPDATE`,
    );

    const event = lockResult.rows[0] as { id: number; available_seats: number } | undefined;

    if (!event) {
      await db.execute(`ROLLBACK`);
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (event.available_seats <= 0) {
      await db.execute(`ROLLBACK`);
      res.status(409).json({ error: "Event is full. No seats available." });
      return;
    }

    const existingReg = await db
      .select({ id: registrationsTable.id })
      .from(registrationsTable)
      .where(
        and(
          eq(registrationsTable.eventId, eventId),
          eq(registrationsTable.userName, userName),
          eq(registrationsTable.status, "active"),
        ),
      );

    if (existingReg.length > 0) {
      await db.execute(`ROLLBACK`);
      res.status(409).json({ error: "User is already registered for this event" });
      return;
    }

    await db.execute(
      `UPDATE events SET available_seats = available_seats - 1 WHERE id = ${eventId}`,
    );

    const [registration] = await db
      .insert(registrationsTable)
      .values({ eventId, userName, status: "active" })
      .returning();

    await db.execute(`COMMIT`);

    res.status(201).json({
      id: registration.id,
      eventId: registration.eventId,
      userName: registration.userName,
      status: registration.status,
      registeredAt: registration.registeredAt.toISOString(),
      cancelledAt: null,
    });
  } catch (err) {
    await db.execute(`ROLLBACK`);
    throw err;
  }
});

router.delete("/registrations/:registrationId", async (req, res): Promise<void> => {
  const params = CancelRegistrationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.id, params.data.registrationId));

  if (!existing) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  if (existing.status === "cancelled") {
    res.status(409).json({ error: "Registration is already cancelled" });
    return;
  }

  const now = new Date();

  await db.execute(`BEGIN`);
  try {
    await db.execute(
      `UPDATE events SET available_seats = available_seats + 1 WHERE id = ${existing.eventId}`,
    );

    const [updated] = await db
      .update(registrationsTable)
      .set({ status: "cancelled", cancelledAt: now })
      .where(eq(registrationsTable.id, params.data.registrationId))
      .returning();

    await db.execute(`COMMIT`);

    res.json({
      id: updated.id,
      eventId: updated.eventId,
      userName: updated.userName,
      status: updated.status,
      registeredAt: updated.registeredAt.toISOString(),
      cancelledAt: updated.cancelledAt ? updated.cancelledAt.toISOString() : null,
    });
  } catch (err) {
    await db.execute(`ROLLBACK`);
    throw err;
  }
});

export default router;
