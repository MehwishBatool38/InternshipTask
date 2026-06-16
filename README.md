<<<<<<< HEAD
# EventBase — Event Registration System

A full-stack REST API for managing events and user registrations with race-condition-safe seat tracking.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Business Rules](#business-rules)
- [Race Condition Handling](#race-condition-handling)
- [Error Responses](#error-responses)

---

## Features

- Create events with unique name, seat limit, and future date
- Register users for events — duplicate-safe and timestamped
- Cancel registrations — seat instantly restored to pool
- Browse all events with sorting (date/name) and upcoming filter
- Live dashboard with real-time stats
- Race-condition-safe overbooking prevention using DB row-level locks

---

## Tech Stack

- **Runtime:** Node.js 24, TypeScript 5
- **Backend:** Express 5
- **Database:** PostgreSQL + Drizzle ORM
- **Validation:** Zod v4, drizzle-zod
- **API Contract:** OpenAPI 3.1 → Orval codegen
- **Frontend:** React 19 + Vite
- **Data Fetching:** TanStack Query (React Query)
- **UI:** shadcn/ui + Tailwind CSS + wouter
- **Package Manager:** pnpm workspaces

---

## Project Structure

```
eventbase/
├── lib/
│   ├── api-spec/
│   │   ├── openapi.yaml               # API contract (single source of truth)
│   │   └── orval.config.ts            # Codegen configuration
│   ├── api-zod/                       # Auto-generated Zod validation schemas
│   ├── api-client-react/              # Auto-generated React Query hooks
│   └── db/src/
│       ├── index.ts                   # DB client export
│       └── schema/
│           ├── events.ts              # Events table
│           ├── registrations.ts       # Registrations table
=======
EventBase — Event Registration System
A full-stack REST API for managing events and user registrations with race-condition-safe seat tracking.

Table of Contents
Features
Tech Stack
Project Structure
Getting Started
Environment Variables
API Endpoints
Database Schema
Business Rules & Validation
Race Condition Handling
Error Responses
Features
Create Events — unique name, seat limit, future date validation
Register Users — per-event, duplicate-safe, timestamped
Cancel Registrations — seat instantly restored to pool
Browse Events — sort by date/name, filter upcoming only
Live Dashboard — real-time stats (total events, registrations, seats)
Race-Condition Safe — database row-level locking prevents overbooking
Tech Stack
Layer	Technology
Runtime	Node.js 24, TypeScript 5
Backend	Express 5
Database	PostgreSQL + Drizzle ORM
Validation	Zod v4 + drizzle-zod
API Contract	OpenAPI 3.1 → Orval codegen
Frontend	React 19 + Vite
Data Fetching	TanStack Query (React Query)
UI	shadcn/ui + Tailwind CSS
Routing	wouter
Package Manager	pnpm workspaces
Project Structure
eventbase/
│
├── lib/
│   ├── api-spec/
│   │   ├── openapi.yaml              # API contract — single source of truth
│   │   └── orval.config.ts           # Codegen configuration
│   ├── api-zod/                      # Auto-generated Zod validation schemas
│   ├── api-client-react/             # Auto-generated React Query hooks
│   └── db/src/
│       ├── index.ts                  # DB client export
│       └── schema/
│           ├── events.ts             # Events table
│           ├── registrations.ts      # Registrations table
>>>>>>> 32eac19cf86ac0be9cf469a065693dea4d92312a
│           └── index.ts              # Barrel export
│
├── artifacts/
│   ├── api-server/src/
<<<<<<< HEAD
│   │   ├── app.ts                     # Express app + middleware
│   │   ├── index.ts                   # Server entry point (port 8080)
│   │   ├── lib/
│   │   │   └── logger.ts              # Pino structured logger
│   │   └── routes/
│   │       ├── index.ts               # Registers all routers
│   │       ├── health.ts              # GET /api/healthz
│   │       ├── events.ts              # Event CRUD + summary stats
│   │       └── registrations.ts       # Register + cancel
│   │
│   └── event-registration/src/
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Root + wouter routing
│       ├── index.css                  # Global theme + Tailwind CSS
│       ├── pages/
│       │   ├── dashboard.tsx          # Live stats + upcoming events
│       │   ├── events.tsx             # All events (sort + filter)
│       │   ├── event-new.tsx          # Create event form
│       │   ├── event-detail.tsx       # Event info + register/cancel
│       │   └── not-found.tsx          # 404 page
│       ├── components/
│       │   ├── layout.tsx             # Sidebar navigation
│       │   └── ui/                    # shadcn/ui components
│       ├── hooks/
│       │   ├── use-toast.ts           # Toast notifications
│       │   └── use-mobile.tsx         # Mobile detection
│       └── lib/
│           └── utils.ts               # Tailwind cn() utility
```

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm
- PostgreSQL

### Install Dependencies

```bash
pnpm install
```

### Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

### Run Development Servers

```bash
# Terminal 1 — API Server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/event-registration run dev
```

### Other Commands

```bash
# Regenerate API hooks + schemas after OpenAPI changes
pnpm --filter @workspace/api-spec run codegen

# Full typecheck
pnpm run typecheck
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Session signing secret | Yes |

---

## API Endpoints

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/healthz` | Server health check |

### Events

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | List all events |
| GET | `/api/events?upcoming=true` | Upcoming events only |
| GET | `/api/events?sortBy=date&sortOrder=asc` | Sort events |
| POST | `/api/events` | Create a new event |
| GET | `/api/events/:id` | Get single event |
| GET | `/api/events/stats/summary` | Dashboard summary stats |

### Registrations

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events/:id/registrations` | List active registrations |
| POST | `/api/events/:id/registrations` | Register user for event |
| DELETE | `/api/registrations/:id` | Cancel a registration |

### Request Body — Create Event

```json
=======
│   │   ├── app.ts                    # Express app + middleware
│   │   ├── index.ts                  # Server entry point (port 8080)
│   │   ├── lib/
│   │   │   └── logger.ts             # Pino structured logger
│   │   └── routes/
│   │       ├── index.ts              # Registers all routers
│   │       ├── health.ts             # GET /api/healthz
│   │       ├── events.ts             # Event CRUD + summary stats
│   │       └── registrations.ts      # Register + cancel
│   │
│   └── event-registration/src/
│       ├── main.tsx                  # React entry point
│       ├── App.tsx                   # Root + wouter routing
│       ├── index.css                 # Global theme + Tailwind CSS
│       ├── pages/
│       │   ├── dashboard.tsx         # Live stats + upcoming events
│       │   ├── events.tsx            # All events (sort + filter)
│       │   ├── event-new.tsx         # Create event form
│       │   ├── event-detail.tsx      # Event info + register/cancel
│       │   └── not-found.tsx         # 404 page
│       ├── components/
│       │   ├── layout.tsx            # Sidebar navigation
│       │   └── ui/                   # shadcn/ui components
│       ├── hooks/
│       │   ├── use-toast.ts          # Toast notifications
│       │   └── use-mobile.tsx        # Mobile detection
│       └── lib/
│           └── utils.ts              # Tailwind cn() utility

Getting Started
Prerequisites
Node.js 24+
pnpm
PostgreSQL
Install Dependencies
pnpm install

Push Database Schema
pnpm --filter @workspace/db run push

Run Development Servers
# Terminal 1 — API Server (port 8080)
pnpm --filter @workspace/api-server run dev
# Terminal 2 — Frontend
pnpm --filter @workspace/event-registration run dev

Other Useful Commands
# Regenerate API hooks + schemas after OpenAPI changes
pnpm --filter @workspace/api-spec run codegen
# Full typecheck (all packages)
pnpm run typecheck
# Typecheck libs only
pnpm run typecheck:libs

Environment Variables
Variable	Description	Required
DATABASE_URL	PostgreSQL connection string	✅ Yes
SESSION_SECRET	Session signing secret	✅ Yes
API Endpoints
Health
Method	Endpoint	Description
GET	/api/healthz	Server health check
Events
Method	Endpoint	Description
GET	/api/events	List all events
GET	/api/events?upcoming=true	Filter upcoming events only
GET	/api/events?sortBy=date&sortOrder=asc	Sort events by date or name
POST	/api/events	Create a new event
GET	/api/events/:id	Get single event details
GET	/api/events/stats/summary	Dashboard summary stats
Registrations
Method	Endpoint	Description
GET	/api/events/:id/registrations	List active registrations
POST	/api/events/:id/registrations	Register a user for an event
DELETE	/api/registrations/:id	Cancel a registration
Request Bodies
POST /api/events

>>>>>>> 32eac19cf86ac0be9cf469a065693dea4d92312a
{
  "name": "Tech Summit 2026",
  "description": "Annual tech gathering",
  "totalSeats": 100,
  "eventDate": "2026-08-15T18:00:00.000Z"
}
<<<<<<< HEAD
```

### Request Body — Register User

```json
{
  "userName": "Ali Hassan"
}
```

---

## Database Schema

### events

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment |
| `name` | TEXT UNIQUE | Must be unique |
| `description` | TEXT | Optional |
| `total_seats` | INTEGER | Total capacity |
| `available_seats` | INTEGER | Updated atomically on register/cancel |
| `event_date` | TIMESTAMPTZ | Must be a future date |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |

### registrations

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment |
| `event_id` | INTEGER FK | References events.id |
| `user_name` | TEXT | Registered user name |
| `status` | TEXT | `active` or `cancelled` |
| `registered_at` | TIMESTAMPTZ | Auto-set on insert |
| `cancelled_at` | TIMESTAMPTZ | Set on cancellation |

---

## Business Rules

| Rule | How Enforced |
|---|---|
| Event name must be unique | DB unique constraint + 409 error |
| Total seats must be greater than 0 | Zod schema validation |
| Event date must be in the future | Server-side date check |
| Cannot register if event is full | Transaction check before insert |
| Same user cannot register twice | Active status check + 409 error |
| Seat restored on cancellation | Atomic UPDATE inside transaction |
| Cancelled users excluded from active list | `WHERE status = 'active'` filter |
| Cancelled records kept for history | Soft delete — status = cancelled |

---

## Race Condition Handling

Uses PostgreSQL **row-level locking** to prevent overbooking when multiple users register at the same time.

**Register flow:**

```
BEGIN TRANSACTION
  SELECT * FROM events WHERE id = ? FOR UPDATE   -- Lock row
  IF available_seats <= 0   → ROLLBACK → 409 Event is full
  IF user already active    → ROLLBACK → 409 Already registered
  UPDATE events SET available_seats = available_seats - 1
  INSERT INTO registrations (event_id, user_name, status = 'active')
COMMIT → 201 Created
```

**Cancel flow:**

```
BEGIN TRANSACTION
  UPDATE events SET available_seats = available_seats + 1
  UPDATE registrations SET status = 'cancelled', cancelled_at = NOW()
COMMIT → 200 OK
```

---

## Error Responses

All errors return JSON in this format:

```json
{
  "error": "Human-readable error message"
}
```

| HTTP Code | Situation |
|---|---|
| 400 | Missing fields, invalid format, past event date |
| 404 | Event or registration not found |
| 409 | Duplicate event name |
| 409 | User already registered for this event |
| 409 | Event is full — no available seats |
| 409 | Registration is already cancelled |

---

## Submission

Repository naming format for Innovaxel assessment:

```
B0626 - [Your Name] - Innovaxel - Backend Intern
```

---

*Built with Express 5 · PostgreSQL · Drizzle ORM · React · TanStack Query*
=======

POST /api/events/:id/registrations

{
  "userName": "Ali Hassan"
}

Database Schema
events table
Column	Type	Description
id	SERIAL PK	Auto-increment primary key
name	TEXT UNIQUE	Event name (must be unique)
description	TEXT	Optional description
total_seats	INTEGER	Total capacity
available_seats	INTEGER	Remaining seats (updated atomically)
event_date	TIMESTAMPTZ	Event date (must be future)
created_at	TIMESTAMPTZ	Auto-set on insert
registrations table
Column	Type	Description
id	SERIAL PK	Auto-increment primary key
event_id	INTEGER FK	References events.id
user_name	TEXT	Name of the registered user
status	TEXT	active or cancelled
registered_at	TIMESTAMPTZ	Auto-set on insert
cancelled_at	TIMESTAMPTZ	Set when registration is cancelled
Business Rules & Validation
Rule	How Enforced
Event name must be unique	DB unique constraint + 409 response
Total seats must be greater than 0	Zod schema + server-side check
Event date must be in the future	Server-side Date comparison
Cannot register if event is full	Checked inside transaction before insert
Same user cannot register twice (same event)	Active registration check + 409 response
Seat restored on cancellation	Atomic UPDATE inside transaction
Cancelled users excluded from active list	WHERE status = 'active' filter on query
Cancelled records retained for history	Soft delete — status set to cancelled
Race Condition Handling
Uses PostgreSQL row-level locking (SELECT ... FOR UPDATE) inside a transaction to prevent overbooking when multiple users register simultaneously.

POST /api/events/:id/registrations
BEGIN TRANSACTION
   │
   ├── SELECT * FROM events WHERE id = ? FOR UPDATE   ← Lock this row
   │
   ├── available_seats <= 0?
   │       YES → ROLLBACK → 409 "Event is full"
   │
   ├── User already registered? (active status)
   │       YES → ROLLBACK → 409 "Already registered"
   │
   ├── UPDATE events SET available_seats = available_seats - 1
   │
   ├── INSERT INTO registrations (event_id, user_name, status='active')
   │
COMMIT → 201 Created

Same pattern for cancellation — seat restored atomically:

DELETE /api/registrations/:id
BEGIN TRANSACTION
   ├── UPDATE events SET available_seats = available_seats + 1
   ├── UPDATE registrations SET status='cancelled', cancelled_at=NOW()
COMMIT → 200 OK

Error Responses
All errors return JSON:

{ "error": "Human-readable error message" }

HTTP Code	Situation
400	Missing fields, invalid format, past event date
404	Event or registration not found
409	Duplicate event name
409	User already registered for this event
409	Event is full — no available seats
409	Registration is already cancelled
Repository Naming (Innovaxel Submission)
B0626 - Mehwish Batool - Innovaxel - Backend Intern

Built with Express 5 · PostgreSQL · Drizzle ORM · React · TanStack Query
>>>>>>> 32eac19cf86ac0be9cf469a065693dea4d92312a
