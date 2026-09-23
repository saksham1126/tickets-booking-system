# Tickets — PROJECT_CONTEXT.md

## 1. Project Purpose

A full-stack movie ticket / seat booking system named **"Tickets"** (formerly "PVR Metro"). This is a college major/final-year project. The central engineering problem the project exists to solve is **preventing double-booking of seats under concurrent load**, demonstrated and tested against real concurrent requests (not just designed on paper).

Secondary goal: build out a realistic multi-page browsing experience (homepage, movie detail, search, showtimes, user profile, login/signup) on top of the core booking engine, using real movie data from TMDb.

---

## 2. Technology Stack

**Backend:** Java 17/21/24, Spring Boot 3.3.2, Spring Security (JWT + BCrypt), Spring Data JPA (Hibernate), Spring WebSocket (STOMP), Spring Retry, MySQL (InnoDB), Redis (via Redisson client), Lombok (1.18.38), Maven. Developed/run in Eclipse IDE.

**Frontend:** React 18 + Vite, React Router v7 (`react-router-dom`), plain CSS (no UI framework), `sockjs-client` + `@stomp/stompjs` for WebSocket, TMDb API (v3/v4 auth) for real movie metadata. Developed/run via `npm run dev`; user edits frontend files in Notepad (not an IDE) and backend files in Eclipse.

**Local dev environment (not deployed anywhere):** MySQL runs as a Windows service. Redis runs inside WSL/Ubuntu and must be manually started every session (`sudo service redis-server start`) — it does not persist across reboots.

---

## 3. Current Frontend Architecture

Located in `booking-frontend/` (nested as `booking-frontend/booking-frontend/`). A multi-page React Router app:

- **`/`** → `HomePage` — hero carousel (auto-rotating trending movies from TMDb) and "Now in Theatres" responsive movie grid.
- **`/movie/:movieId`** → `MovieDetailPage` — fetches real movie data from TMDb (poster, rating, runtime, genres, certification, synopsis, cast/crew with real photos, real spoken languages). Defaults to TMDb movie id `157336` (Interstellar) if no id given.
- **`/showtimes`** → `ShowtimesPage` — a 7-day date strip (real computed dates), legend, and cinema list. Reads `movie`, `movieId`, `language`, `format` from URL query string.
- **`/seatmap`** → `SeatMapPage` — the original, fully working seat booking screen. WebSocket-driven live updates, hold/confirm flow with real authenticated user ID.
- **`/login`** → `LoginPage` — mobile number (+91) and password login with show/hide toggle.
- **`/signup`** → `SignupPage` — registration with name, 10-digit mobile, password.
- **`/profile`** → `ProfilePage` — user profile with avatar initial, mobile number, menu links, and logout.

**Two intentional visual themes:**
- `theme.css` (`bw-` prefixed classes) — a black-and-white monochrome "browse" theme used by `MovieDetailPage`, `ShowtimesPage`, `LanguageFormatModal`, `SearchBar`.
- `SeatMapPage.css` — the original amber/violet cinema theme, unchanged, used only by the seat map.
This split is a deliberate design choice (browsing feels editorial/monochrome; the seat map is where color appears), not an inconsistency to "fix."

**Key frontend files:**
- `src/App.jsx` — router config (`<Routes>`)
- `src/main.jsx` — wraps `<App />` in `<BrowserRouter>`
- `src/api.js` — REST calls to the backend (`fetchSeatMap`, `placeHold`, `releaseHold`, `confirmBooking`)
- `src/useSeatMapSocket.js` — WebSocket/STOMP subscription hook used by `SeatMapPage`
- `src/tmdb.js` — TMDb API client: `fetchMovie(movieId)`, `searchMovies(query)`
- `src/theme.css` — shared monochrome design tokens/classes for the browse pages
- `src/pages/MovieDetailPage.jsx` + `.css`
- `src/pages/ShowtimesPage.jsx` + `.css`
- `src/pages/SeatMapPage.jsx` + `.css`
- `src/components/LanguageFormatModal.jsx` + `.css` — shows real per-movie languages (from TMDb `spoken_languages`); format options (2D/3D) are a fixed generic list since no public API tracks per-movie exhibition formats
- `src/components/SearchBar.jsx` — debounced real TMDb search with a results dropdown, navigates to `/movie/:id`
- `.env` — holds `VITE_TMDB_READ_TOKEN` and `VITE_TMDB_API_KEY` (gitignored)
- `vite.config.js` — has `define: { global: 'globalThis' }`, required for `sockjs-client` to work under Vite (without this the app crashes with "global is not defined")

---

## 4. Current Backend Architecture

Package root: `com.example.booking`, in `booking-service/`. Layered structure:
`entity`, `entity.enums`, `repository`, `service`, `controller`, `dto`, `config`, `exception`, `scheduled`.

**Concurrency model (the core of the project) — three layers, in order:**
1. **Redis distributed lock** (`SeatHoldService`, via Redisson `RBucket.trySet(sessionId, ttlSeconds, TimeUnit.SECONDS)`) — fast advisory hold with a 5-minute TTL, acts like `SET NX EX`.
2. **JPA optimistic lock** (`SeatInventory.version`, a `@Version Long` field) — enforced inside `BookingService.confirmBooking()`, wrapped in `@Retryable(retryFor = OptimisticLockingFailureException.class, maxAttempts = 3, backoff = @Backoff(delay = 100, multiplier = 2))`.
3. **Database UNIQUE constraint** on `booking_seat.seat_inventory_id` — the final backstop; makes double-booking physically impossible even if the above two layers had a bug.

**WebSocket:** `WebSocketConfig` registers a `/ws` SockJS endpoint and a `/topic` STOMP broker. `SeatHoldService`, `BookingService`, and `HoldExpiryCleanupJob` all broadcast `SeatStatusUpdate` (`{seatInventoryId, status}`) messages to `/topic/seatmap/{eventInstanceId}` whenever a seat's status changes (HELD, BOOKED, or AVAILABLE again).

**Other backend components:**
- `CorsConfig` — allows only `http://localhost:5173` on `/api/**`
- `RedissonConfig` — connects to `redis://localhost:6379`
- `HoldExpiryCleanupJob` — `@Scheduled(fixedDelay = 30_000)`, sweeps any seat still `HELD` past its `hold_expires_at` back to `AVAILABLE` (fallback for the rare case Redis TTL expiry and the DB write get out of sync)
- `GlobalExceptionHandler` — maps `SeatUnavailableException` → 409, `SeatHoldExpiredException` → 409, `BookingConflictException` → 409, `DataIntegrityViolationException` → 409 (the UNIQUE-constraint backstop case)

**A `DemoResetRunner` (startup task that would wipe all bookings and reset seats on every app restart) was proposed and explicitly rejected by the user — it was never created. Do not reintroduce this pattern.** The user's actual long-term intent (seats becoming available again after a showtime ends) will be solved properly later via multiple `event_instance` rows per real showtime, not by wiping data.

---

## 5. Database Structure and Key Relationships

MySQL, `InnoDB` engine. Tables (see `schema.sql`):

- **`venue`** — id, name, city
- **`app_user`** — id, email (unique), name. **No password or mobile number columns exist yet** — this is a known gap, not yet built.
- **`seat`** — id, venue_id (FK), section, row_label, seat_number, seat_type (category name, e.g. `PRIME`/`CLASSIC`/`CLASSIC PLUS`/`EXECUTIVE`); `UNIQUE(venue_id, section, row_label, seat_number)`
- **`event_instance`** — id, venue_id (FK), title, starts_at, ends_at, status — represents one specific showtime. **Currently only one row exists (id=1)**, and its `starts_at` is already in the past relative to "today." A cleanup script exists (`cleanup_past_showtimes.sql`) but has **not been run** — deliberately deferred until real multi-showtime support is built.
- **`seat_inventory`** — id, event_instance_id (FK), seat_id (FK), price_cents, status (`AVAILABLE`/`HELD`/`BOOKED`/`BLOCKED`), held_by_session, hold_expires_at, **version** (the optimistic-lock column); `UNIQUE(event_instance_id, seat_id)`
- **`booking`** — id, user_id (FK), event_instance_id (FK), status (`PENDING_PAYMENT`/`CONFIRMED`/`CANCELLED`/`EXPIRED`), total_amount_cents, idempotency_key (unique), created_at, confirmed_at
- **`booking_seat`** — id, booking_id (FK), seat_inventory_id (FK), price_cents; **`UNIQUE(seat_inventory_id)`** — this is the critical constraint that makes a seat physically unable to belong to two bookings.

Seed data (`seed.sql` + `add_more_seats.sql` + `recategorize_seats.sql`): 50 seats (rows A–J × 5) for `event_instance_id=1`, in 4 priced categories: PRIME (A–B, ₹150), CLASSIC (C–E, ₹200), CLASSIC PLUS (F–H, ₹250), EXECUTIVE (I–J, ₹350).

**Schema is NOT auto-managed by Hibernate** — `ddl-auto: validate` in `application.yml` means schema changes must be applied manually via SQL scripts in `src/main/resources/`, never by just changing an entity and restarting.

---

## 6. Important Folders and Files

```
booking-service/
  src/main/java/com/example/booking/
    entity/            (Venue, Seat, EventInstance, SeatInventory, AppUser, Booking, BookingSeat)
    entity/enums/       (SeatStatus, BookingStatus)
    repository/         (Spring Data JPA repos, one per entity)
    service/            (SeatHoldService, BookingService)
    controller/         (HoldController, BookingController, SeatMapController)
    dto/                (HoldRequest/Response, BookingRequest/Response, SeatStatusUpdate)
    config/             (RedissonConfig, WebSocketConfig, CorsConfig)
    exception/          (custom exceptions + GlobalExceptionHandler)
    scheduled/          (HoldExpiryCleanupJob)
  src/main/resources/
    application.yml
    schema.sql, seed.sql, add_more_seats.sql, recategorize_seats.sql, cleanup_past_showtimes.sql
  race_test.sh          (bash script proving concurrent-hold correctness)

booking-frontend/
  .env                  (TMDb credentials, gitignored)
  vite.config.js
  src/
    App.jsx, main.jsx
    api.js, tmdb.js, useSeatMapSocket.js, theme.css
    pages/     (MovieDetailPage, ShowtimesPage, SeatMapPage — each with matching .css)
    components/(LanguageFormatModal, SearchBar — each with matching .css)
```

---

## 7. Important APIs / Endpoints

**REST (backend, base `http://localhost:8080/api`):**
- `GET /events/{eventInstanceId}/seatmap` — returns all seats for that showtime: `{seatInventoryId, section, row, seatNumber, status, priceCents, category}`
- `POST /holds` — body `{eventInstanceId, seatIds[], sessionId}` → places Redis + DB hold, returns `{holdId, seatInventoryIds[], expiresAt}`; `409 SEAT_UNAVAILABLE` if already held
- `DELETE /holds?eventInstanceId=&seatId=&sessionId=` — releases a hold early
- `POST /bookings` — body `{userId, eventInstanceId, seatInventoryIds[], sessionId, paymentMethodToken}` → confirms booking, flips seats to `BOOKED`; `409 HOLD_EXPIRED` / `409 BOOKING_CONFLICT` on failure

**WebSocket:** `ws://localhost:8080/ws` (SockJS), subscribe to `/topic/seatmap/{eventInstanceId}` to receive live `{seatInventoryId, status}` push updates.

**External (TMDb, called from the frontend directly, not proxied through the backend):**
- `fetchMovie(movieId)` in `tmdb.js` — combines `/movie/{id}`, `/movie/{id}/credits`, `/movie/{id}/release_dates`
- `searchMovies(query)` in `tmdb.js` — `/search/movie?query=...`

---

## 8. Important Classes, Components, Services, Functions

- `SeatHoldService.placeHold()` / `.releaseHold()` — Redis lock layer, also writes denormalized status to `seat_inventory` and broadcasts via WebSocket
- `BookingService.confirmBooking()` — the `@Version`-checked, `@Retryable` transactional confirm step; also handles idempotency via `idempotency_key`
- `HoldExpiryCleanupJob.reclaimExpiredHolds()` — scheduled fallback sweep
- `SeatMapController.getSeatMap()` — read endpoint backing the seat grid
- Frontend: `MovieDetailPage`'s `PersonCard` sub-component — renders a real photo if TMDb has one, falls back to initials otherwise (this fallback is correct/expected behavior, not a bug — many smaller/regional films have incomplete TMDb photo data)
- Frontend: `SearchBar`'s debounce logic (350ms) before calling `searchMovies`

---

## 9. Features Already Completed and Working

- Full three-layer double-booking prevention, proven via manual curl testing, `race_test.sh` (10 simultaneous requests → exactly 1 winner), and live two-browser-tab testing
- Live WebSocket sync of seat status (HELD/BOOKED/AVAILABLE) across independent browser sessions with zero polling
- 50-seat, 4-category priced seat map with hold → confirm flow
- Real TMDb-powered movie detail page: poster, rating, runtime, genres, certification, synopsis, cast/crew (with real photos where available), real spoken-language list
- Real TMDb search with debounced dropdown and thumbnails, routes to `/movie/:id`
- Language/format selection modal shows the movie's real language(s); format list is intentionally generic (no data source exists for it)
- Showtimes page correctly displays whichever movie was actually selected (title/language/format carried via URL params) — only one cinema/showtime ("PVR: Metro, Indore") is backed by real data; the other two cinemas are shown with all times as `SOLD_OUT` rather than faking availability
- CORS, WebSocket, Redis, and MySQL all confirmed wired and working together end to end

---

## 10. Current Known Bugs / Issues

- Only one real `event_instance` exists; its date is already in the past. `cleanup_past_showtimes.sql` exists to fix this but is **intentionally not yet run** (waiting on multi-showtime work first, to avoid doing the cleanup twice).
- Every showtime button for the one "live" cinema leads to the same single seat map, regardless of which movie was searched for — there is no real per-movie showtime data yet.
- Full JWT authentication with Spring Security and BCrypt now implemented; `mobile_number` and `password_hash` are present in `app_user`.
- Project branding has been renamed to "Tickets" across all pages.

---

## 11. Important Configuration

- `application.yml`: `spring.datasource.url=jdbc:mysql://localhost:3306/booking_db`, user `booking_user`/`booking_pass`; `spring.jpa.hibernate.ddl-auto=validate`; `redis.address=redis://localhost:6379`
- `.env` (frontend, gitignored): `VITE_TMDB_READ_TOKEN`, `VITE_TMDB_API_KEY`
- `vite.config.js`: `define: { global: 'globalThis' }` — required, do not remove

---

## 12. Important Dependencies

**Backend (`pom.xml`):** `spring-boot-starter-web`, `spring-boot-starter-security`, `jjwt` (0.12.6), `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, `spring-boot-starter-websocket`, `spring-retry` + `spring-aspects`, `redisson-spring-boot-starter` (3.32.0), `mysql-connector-j`, `lombok` (1.18.38).
 
 **Frontend (`package.json`):** `react`, `react-dom`, `react-router-dom` (^7), `sockjs-client`, `@stomp/stompjs`, `vite`, `@vitejs/plugin-react`.
 
 ---
 
 ## 13. Important Architectural Decisions
 
 - Optimistic (not pessimistic) locking was chosen for the DB layer to keep throughput high; Redis absorbs high-contention browsing before it ever reaches the DB.
 - The two-theme frontend split (monochrome browse pages vs. colorful seat map) is intentional.
 - Movie *metadata* comes from TMDb; showtime/cinema/seat *availability* is intentionally never sourced from any external API — no free or paid public API exposes real cinema showtime data (that's proprietary data owned by ticketing companies). This data lives entirely in the app's own MySQL database by design, and always will.
 - Startup-time data wiping (`DemoResetRunner`) was considered and explicitly rejected. Any future "seats free up after a showtime ends" behavior must come from proper per-showtime `event_instance` rows, never from wiping data on restart.
 
 ---
 
 ## 14. Things That Should Not Be Changed Unnecessarily
 
 - The three-layer concurrency mechanism (Redis lock → `@Version` → UNIQUE constraint) — this is the entire point of the project.
 - `SeatMapPage.jsx`/`.css` — tested and working; treat as stable unless a specific bug is found there.
 - `ddl-auto: validate` — don't switch to `update`/`create-drop`; schema changes go through explicit SQL scripts only.
 - The `bw-` theme / seat-map theme visual separation.
 - Do not reintroduce a startup data-reset job.
 
 ---
 
 ## 15. How the Frontend Communicates with the Backend
 
 Two channels:
 1. **REST over `fetch()`** (`src/api.js`) to `http://localhost:8080/api/*` for all read/write actions (seat map fetch, hold, release, confirm) and `http://localhost:8080/api/auth/*` for login/signup/me.
 2. **STOMP over WebSocket via SockJS** (`src/useSeatMapSocket.js`) to `ws://localhost:8080/ws`, subscribing to `/topic/seatmap/{eventInstanceId}` for live push updates — this is one-way (server→client); all state-changing actions still go through REST.
 
 CORS is explicitly scoped to `http://localhost:5173` only.
 
 ---
 
 ## 16. How the Database Is Used
 
 MySQL is the single durable source of truth for all seat and booking state. Redis is **only** an ephemeral, advisory lock layer (TTL-based holds) — it is never treated as a source of truth, and its failure would degrade UX but not correctness, because the DB-layer optimistic lock and UNIQUE constraint independently guarantee no double-booking. Access is via Spring Data JPA repositories (one per entity); no raw SQL in application code except the setup scripts.
 
 ---
 
 ## 17. Important Constraints and Assumptions
 
 - Everything runs locally only; nothing is deployed. Assume `localhost:8080` (backend) and `localhost:5173` (frontend) throughout.
 - Redis must be manually started every session (WSL/Ubuntu) — it does not persist.
 - The user's workflow: Eclipse for all backend `.java`/`.yml` edits; plain Notepad for all frontend `.jsx`/`.css`/`.js` edits (no frontend IDE). Prefers being given exact full-file contents to paste rather than fragile partial diffs, and step-by-step instructions with sub-steps broken out individually.
 - The user has repeatedly asked for full-file replacements over incremental patches for frontend files, because partial/manual edits in Notepad have silently failed to apply correctly multiple times in this project's history.
 - TMDb API key is used directly from the frontend (not proxied through the backend) — acceptable for local dev/demo, would need to move server-side before any public deployment.
 
 ---
 
 ## 18. Current State Summary — What To Know Before Adding Features
 
 The core booking engine (backend concurrency + WebSocket + seat map frontend) is **complete, tested, and stable**. The frontend browsing experience (homepage, detail, showtimes, profile, auth) and backend JWT security layer are fully implemented and integrated.
 
 **Pending / next planned work:**
 1. Real multi-showtime data model (multiple `event_instance` rows for different movies/times/dates), which is also the correct long-term fix for "seats should free up after a showtime ends."
 2. Only after #1: run `cleanup_past_showtimes.sql` to clear the stale test showtime/bookings.
 3. Optional: a real "View all bookings" history page linked from the profile page.
 4. Optional: a JUnit test isolating the JPA `@Version` optimistic-lock layer from Redis specifically, for portfolio/test-coverage purposes.
