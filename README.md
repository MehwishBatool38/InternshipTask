EventBase — Event Registration System
A full-stack Event Registration System with seat management, race-condition-safe booking, and real-time stats.

Features
Create events with unique names, seat limits, and future dates
Register users for events — duplicate and overbooking prevention
Cancel registrations — seat instantly returned to pool
Browse all events with date sorting and upcoming-only filter
Live dashboard with summary stats
Race-condition-safe seat tracking using database row-level locks
Tech Stack
Layer	Technology
Backend	Node.js 24, Express 5, TypeScript
Database	PostgreSQL + Drizzle ORM
Validation	Zod (v4), drizzle-zod
API Contract	OpenAPI 3.1 + Orval codegen
Frontend	React + Vite + TanStack Query
UI	shadcn/ui + Tailwind CSS + wouter
Package Manager	pnpm workspaces
Project Structure
eventbase/
│
├── lib/
│   ├── api-spec/
│   │   ├── openapi.yaml              # API contract (single source of truth)
│   │   └── orval.config.ts           # Codegen config (generates hooks + schemas)
│   ├── api-zod/                      # Auto-generated Zod validation schemas
│   ├── api-client-react/             # Auto-generated React Query hooks
│   └── db/
│       └── src/
│           ├── index.ts              # DB client export
│           └── schema/
│               ├── events.ts         # Events table definition
│               ├── registrations.ts  # Registrations table definition
│               └── index.ts          # Schema barrel export
│
├── artifacts/
│   ├── api-server/
│   │   └── src/
│   │       ├── app.ts                # Express app + middleware setup
│   │       ├── index.ts              # Server entry point (port 8080)
│   │       ├── lib/
│   │       │   └── logger.ts         # Pino structured logger
│   │       └── routes/
│   │           ├── index.ts          # Registers all routers
│   │           ├── health.ts         # GET /api/healthz
│   │           ├── events.ts         # Event CRUD + summary stats
│   │           └── registrations.ts  # Register + cancel
│   │
│   └── event-registration/
│       └── src/
│           ├── main.tsx              # React entry point (QueryClient setup)
│           ├── App.tsx               # Root component + wouter routing
│           ├── index.css             # Global theme + Tailwind CSS
│           ├── pages/
│           │   ├── dashboard.tsx     # Live stats + upcoming events
│           │   ├── events.tsx        # All events with sort + filter
│           │   ├── event-new.tsx     # Create event form
│           │   ├── event-detail.tsx  # Event info + registrations list
│           │   └── not-found.tsx     # 404 page
│           ├── components/
│           │   ├── layout.tsx        # Sidebar navigation layout
│           │   └── ui/               # shadcn/ui components (40+ components)
│           ├── hooks/
│           │   ├── use-toast.ts      # Toast notification hook
│           │   └── use-mobile.tsx    # Mobile screen detection
│           └── lib/
│               └── utils.ts          # Tailwind cn() merge utility

Getting Started
Prerequisites
Node.js 24+
pnpm
PostgreSQL database
Environment Variables
Create a .env file or set these in your environment:

DATABASE_URL=postgresql://user:password@localhost:5432/eventbase
SESSION_SECRET=your-secret-here

Install Dependencies
pnpm install

Push Database Schema
pnpm --filter @workspace/db run push

Run in Development
Start the API server:

pnpm --filter @workspace/api-server run dev

Start the frontend:

pnpm --filter @workspace/event-registration run dev

Regenerate API Code (after OpenAPI changes)
pnpm --filter @workspace/api-spec run codegen

Typecheck All Packages
pnpm run typecheck

API Endpoints
Events
Method	Endpoint	Description
GET	/api/events	List all events (supports ?upcoming=true&sortBy=date&sortOrder=asc)
POST	/api/events	Create a new event
GET	/api/events/:id	Get single event details
GET	/api/events/stats/summary	Get dashboard summary stats
Registrations
Method	Endpoint	Description
GET	/api/events/:id/registrations	List active registrations for an event
POST	/api/events/:id/registrations	Register a user for an event
DELETE	/api/registrations/:id	Cancel a registration
Health
Method	Endpoint	Description
GET	/api/healthz	Server health check
Database Schema
events
id             SERIAL PRIMARY KEY
name           TEXT NOT NULL UNIQUE
description    TEXT
total_seats    INTEGER NOT NULL
available_seats INTEGER NOT NULL
event_date     TIMESTAMPTZ NOT NULL
created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()

registrations
id             SERIAL PRIMARY KEY
event_id       INTEGER NOT NULL REFERENCES events(id)
user_name      TEXT NOT NULL
status         TEXT NOT NULL DEFAULT 'active'  -- 'active' | 'cancelled'
registered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
cancelled_at   TIMESTAMPTZ

Business Rules
Rule	Enforcement
Event name must be unique	DB unique constraint + 409 response
Total seats must be > 0	Zod schema validation
Event date must be in future	Server-side date check
Cannot register if event is full	Transaction check before insert
Same user cannot register twice	Active registration check
Cancellation restores the seat	Atomic transaction update
Cancelled users excluded from active list	status = 'active' filter
Race Condition Safety
Registration uses a PostgreSQL row-level lock to prevent overbooking:

BEGIN;
SELECT * FROM events WHERE id = ? FOR UPDATE;  -- Lock the row
-- Check seats available
-- Check duplicate registration
UPDATE events SET available_seats = available_seats - 1 WHERE id = ?;
INSERT INTO registrations (event_id, user_name, status) VALUES (?, ?, 'active');
COMMIT;

If two requests arrive simultaneously for the last seat, the second one waits for the first transaction to complete, then receives a "Event is full" error — no overbooking possible.

Error Responses
All errors return JSON in this format:

{ "error": "Human-readable error message" }

HTTP Code	Situation
400	Validation error (missing fields, bad format, past date)
404	Event or registration not found
409	Duplicate name, already registered, event full, already cancelled
Frontend Pages
Route	Page	Description
/	Dashboard	Live stats + upcoming events overview
/events	Events List	All events with sorting and filtering
/events/new	Create Event	Form to create a new event
/events/:id	Event Detail	Full event info, registrations, register/cancel
Architecture Decisions
Contract-first API — OpenAPI spec is written first, then Zod schemas and React hooks are auto-generated. Never hand-write types that codegen produces.

Denormalized availableSeats — Stored directly on the events table and updated inside every registration/cancellation transaction. Avoids expensive COUNT queries on the hot read path.

Row-level locking — SELECT ... FOR UPDATE inside a transaction is the simplest and most reliable way to prevent race conditions in PostgreSQL without advisory locks or application-level queuing.

Cancelled records retained — Registrations are never deleted; they are marked cancelled. This preserves audit history and allows reporting on who cancelled.

Submission
(Innovaxel assessment):

B0626 - [Mehwish Batool] - Innovaxel - Backend Intern
