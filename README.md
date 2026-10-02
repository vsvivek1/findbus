# Findbus

Live bus tracking for private and city buses. Bus owners register their buses
and send each driver a link; the driver's phone shares its location while the
trip runs, and riders see buses live on a map.

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/` | Everyone | Landing page with a waitlist for riders and bus owners |
| `/find` | Riders | Search by stop, route or bus number and see buses on a live map |
| `/owner` | Owners | Free sign-up; creates a private dashboard link |
| `/owner/dashboard?key=…` | Owners | Add buses, routes and stops, share driver links, pause or remove buses |
| `/driver?key=…` | Drivers | Big Start/Stop button that sends the phone's GPS every 10 seconds |

## Stack

- Next.js (App Router) + Tailwind CSS, deployable to Vercel
- Supabase Postgres. Everything is prefixed `fb_` so it can share a project
  with other apps. Tables are locked with RLS; the browser only calls the
  `fb_*` database functions, which check the owner or driver secret.
- Leaflet with OpenStreetMap tiles

## Setup

1. Apply the SQL in `supabase/migrations/` to your Supabase project, in order.
   The second file adds four demo buses around Kozhikode; remove them any
   time with `delete from fb_owners where is_demo;`.
2. Copy `.env.example` to `.env.local` and fill in the project URL and
   publishable (anon) key.
3. `npm install && npm run dev`

## Reading the waitlist

```sql
select role, name, phone, email, city, bus_count, note, created_at
from fb_waitlist order by created_at desc;
```
