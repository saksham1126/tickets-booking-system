# Booking Frontend (React + Vite + React Router)

A multi-page movie booking flow for the booking-service backend:

1. **Movie detail page** (`/`) — poster placeholder, rating, tags, synopsis,
   cast/crew, "Book tickets" button.
2. **Language/format modal** — opens on "Book tickets", pick a language
   and format, routes to showtimes.
3. **Showtimes page** (`/showtimes`) — 7-day date strip, multiple cinema
   listings, showtimes in 3 states (available / fast-filling / sold out).
4. **Seat map** (`/seatmap`) — your original live, WebSocket-backed,
   double-booking-safe seat selection screen. Unchanged.

## Design intent

Pages 1–3 use a deliberate black-and-white monochrome theme (`theme.css`,
`bw-` prefixed classes) — a distinct "browse" visual language from the
seat map's amber/violet cinema palette. The tonal shift from grayscale
browsing into color at the seat map is intentional: it's the moment you
go from looking to actually choosing.

## Important: what's real vs. demo layout

Your backend only has ONE seeded showtime (`event_instance_id=1`, "PVR:
Metro, Indore"). To make the showtimes page look like a real listings
page, it shows two other cinemas with multiple showtimes — but since
there's no real inventory behind them, **their showtimes are shown as
SOLD OUT** rather than faking availability that doesn't exist. Only PVR
Metro's two showtimes are clickable, and both route to your one real
seat map, since that's the only actual event in the database.

If you add more `event_instance` rows to the database later, wire the
`handleShowtimeClick` function in `ShowtimesPage.jsx` to navigate with
the real `eventInstanceId` instead of the hardcoded `/seatmap` route.

## Prerequisites

- The `booking-service` backend running on `localhost:8080` (MySQL +
  Redis both up).
- Node.js 18+.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). You'll land on
the movie detail page — click through the full flow: Book tickets →
pick a language/format → pick a showtime → select seats → confirm.
