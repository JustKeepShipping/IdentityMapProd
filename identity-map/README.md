# Identity Map – Increment 1

This repository contains a minimal working slice of the **Identity Map** application.  In this first increment we provide a thin vertical slice that allows a facilitator to create a session and participants to join the session with a code, subject to consent and visibility controls.  It does **not** yet include identity entry or similarity computation.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   - Create a new Supabase project.
   - Copy the contents of `supabase/schema.sql` into the SQL editor in Supabase to create the `sessions` and `participants` tables and associated row‑level security (RLS) policies.
   - Generate a Service Role key and an anon key in Supabase.  These keys are required for the server and client to communicate with Supabase.
   - Fill out the `.env.local` file (create one from `.env.local.example`) with your Supabase project’s URL, anon key and service role key.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` in your browser.  You should see the **Join a Session** page.  Use the `/api/createSession` endpoint (e.g. via a REST client or curl) to create a session and obtain a join code, then try joining from the form.

   Facilitators can also visit `http://localhost:3000/create-session` to create a new session using a simple form that returns the join code directly in the UI.  This eliminates the need to call the API manually.

## Architecture overview

### Frontend

The `pages/index.tsx` component implements a simple **Join Session** screen following modern accessibility conventions.  Participants are required to enter a display name and a join code, opt in to consent, and optionally choose to be visible to others.  The submit button is disabled while waiting for the response, and both client‑side and server‑returned errors are surfaced to the user.

### API routes

Two API routes are implemented under `pages/api`:

| Route | Description | Method | Notes |
|------|-------------|--------|------|
| `/api/createSession` | Creates a new session with a unique code and returns the code and session ID. | POST | Accepts `{ title, facilitatorEmail?, expiresAt? }`. Validates inputs, generates a unique code, and inserts into the database. Returns a 400 on bad input, 405 on wrong method and 500 on server error. |
| `/api/joinSession` | Adds a participant to a session. | POST | Accepts `{ code, displayName, isVisible, consentGiven }`. Validates the inputs, verifies that the session exists and is not expired, and inserts the participant. Returns appropriate error codes for invalid input, missing consent, non‑existent or expired sessions, or insertion failures. |

Both routes use the service role Supabase client (`lib/supabaseAdmin.ts`) to perform privileged operations and enforce explicit input validation and error handling.

### Database

The SQL schema in `supabase/schema.sql` defines two tables:

* `sessions` – stores session metadata, including a unique join code and optional expiry.
* `participants` – stores participant aliases, consent and visibility flags linked to a session.

Row‑level security is enabled on both tables.  A policy permits anyone to read sessions, another allows service side insertion of sessions, a policy allows any user to insert a participant row, and a final policy restricts participants to reading only their own record (future increments may adjust policies as needed).

## Future work

This slice lays the groundwork for future increments.  Next increments will extend the data model with identity items, implement similarity logic and ranking, and expose additional pages for entering identities and viewing matches.  We will also introduce comprehensive unit and integration tests and progressively refine the UI/UX based on feedback.
