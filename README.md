# Tickets — High-Concurrency Ticket Booking System

A production-grade, distributed movie ticketing platform engineered specifically to solve the **Double-Booking Race Condition Problem** under high concurrency and traffic spikes.

Built with **Spring Boot 3**, **Redisson (Redis)**, **MySQL**, **React (Vite)**, **STOMP WebSockets**, and **Razorpay Payment Gateway**.

---

## 🎯 The Core Problem: Race Conditions in Flash Ticketing

In high-demand ticketing scenarios (e.g., flash sales, blockbuster movie releases), thousands of users attempt to select and book the exact same seat within milliseconds.

Traditional database transactions fail here:
* **Naive reads and updates** lead to **double bookings** (two users get charged for Seat C3).
* **Pessimistic database locking (`SELECT ... FOR UPDATE`)** creates massive database connection bottlenecks, thread starvation, and server timeouts under load.

### The Solution: 3-Tier Defensive Concurrency Architecture

This project implements a multi-tier defense system that eliminates race conditions while maintaining sub-millisecond responsiveness:

```
[ Incoming Requests from Users / Tabs ]
                  │
                  ▼
┌────────────────────────────────────────────────────────┐
│  LAYER 1: Redis Atomic Hold (Redisson RBucket SETNX)   │
│  - In-memory atomic hold with 5-minute TTL.           │
│  - Only 1 user can acquire the lock (O(1) speed).      │
│  - Prevents database writes during browsing.           │
└─────────────────────────┬──────────────────────────────┘
                          │ (If hold acquired)
                          ▼
┌────────────────────────────────────────────────────────┐
│  LAYER 2: JPA Optimistic Locking (@Version)            │
│  - Hibernate verifies row version at checkout time.    │
│  - Detects if an expired or invalid hold was touched.  │
│  - Throws OptimisticLockException on stale writes.     │
└─────────────────────────┬──────────────────────────────┘
                          │ (If version matches)
                          ▼
┌────────────────────────────────────────────────────────┐
│  LAYER 3: Relational DB Engine Constraints             │
│  - Hard UNIQUE KEY (`event_instance_id`, `seat_id`).   │
│  - Hard UNIQUE KEY on `booking_seat.seat_inventory_id`.│
│  - Mathematical guarantee that 1 seat = 1 booking.     │
└────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Role |
|---|---|---|
| **Frontend** | React 18, Vite, React Router 7 | Dark monochrome minimalist UI ("Tickets"), responsive seat map, live status |
| **Backend** | Spring Boot 3.3, Java 17+ | REST APIs, Spring Security (Stateless JWT), Redisson, Transaction management |
| **Distributed Cache** | Redis 7+ via Redisson | Distributed atomic locks (`RBucket.trySet`), TTL expiration, fast inventory hold |
| **Database** | MySQL 8.0+ | Relational schema with optimistic lock `@Version` and unique constraints |
| **Real-time Sync** | Spring WebSocket + STOMP | Pushes seat status (`AVAILABLE`, `HELD`, `BOOKED`) live to all open tabs |
| **Payment Gateway**| Razorpay (HMAC-SHA256) | Order creation, dynamic checkout modal, signature verification |

---

## ✨ Key Features

1. **Defensive Concurrency Handling**:
   - High-throughput Redis distributed holds prevent database lock contention.
   - Guaranteed single-ticket confirmation even when concurrent requests arrive at the same microsecond.

2. **Real-time Multi-Client Synchronization**:
   - The seat map reflects live holds and releases across all active users in real time via STOMP WebSockets (`/topic/seatmap/{id}`).
   - When a user selects a seat in Tab A, it immediately turns `HELD` in Tab B.

3. **Complete Dark Monochrome UX ("Tickets")**:
   - Custom cinematic theater seating layout with tiered pricing (Prime, Classic, Classic Plus, Executive).
   - Dynamic showtimes across multiple cinemas (`Tickets Cinema`, `Cineplex: Treasure Mall`, `Grand Screens: Phoenix Citadel`).
   - Perforated digital cinema ticket with barcode stub upon payment confirmation.

4. **Integrated Payment Gateway (Razorpay)**:
   - Automated server-side order generation in paise.
   - Tickets-styled checkout modal supporting UPI, Credit/Debit Cards, and NetBanking.
   - Cryptographic HMAC-SHA256 signature verification.

5. **Exclusive Owner / Admin Mode (Interview Demo Feature)**:
   - Protected endpoint: `POST /api/events/{id}/reset` secured by Admin JWT or 4-digit PIN (`2005`).
   - Dedicated Owner Portal (`/admin` or `/owner`) for **Saksham Pathak** (`8602891120`).
   - Completely invisible to regular users.
   - **One-Click Live Demo Reset**: Instantly resets all 50 seats to available, flushes Redis, and updates all connected clients live via WebSockets.

---

## 📡 REST API Reference

### Public & Authentication Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user with mobile number and password |
| `POST` | `/api/auth/login` | Login with mobile number and password |
| `POST` | `/api/auth/admin-login` | Owner sign-in with phone `8602891120` & PIN `2005` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### Seat Inventory & Booking Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events/{id}/seatmap` | Fetch all seats and statuses for an event instance |
| `POST` | `/api/holds` | Atomically place a 5-minute hold on selected seats in Redis |
| `DELETE`| `/api/holds` | Release active hold on a seat |
| `POST` | `/api/bookings` | Finalize ticket confirmation with optimistic lock validation |

### Payment Endpoints (Razorpay)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payment/create-order` | Create an official Razorpay Order ID |
| `POST` | `/api/payment/verify` | Verify cryptographic payment signature |

### Owner / Admin Endpoint
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events/{id}/reset` | **Owner Only**: Reset all seats, clear bookings, evict Redis cache |

---

## 🚀 Local Development Setup

### Prerequisites
* **Java 17+** (or Java 21 / 24)
* **Maven 3.8+**
* **Node.js 18+** & npm
* **MySQL 8.0+**
* **Redis** (running locally or in WSL Ubuntu)

---

### Step 1: Start Redis
If using WSL / Ubuntu:
```bash
sudo service redis-server start
```
Verify with `redis-cli ping` (should output `PONG`).

---

### Step 2: Set Up MySQL Database
Create database and user:
```sql
CREATE DATABASE booking_db;
CREATE USER 'booking_user'@'localhost' IDENTIFIED BY 'booking_pass';
GRANT ALL PRIVILEGES ON booking_db.* TO 'booking_user'@'localhost';
FLUSH PRIVILEGES;
```
Run the migration scripts located in `booking-service_1/booking-service/src/main/resources/`:
```bash
mysql -u booking_user -pbooking_pass booking_db < auth_migration.sql
mysql -u booking_user -pbooking_pass booking_db < add_role_column.sql
```

---

### Step 3: Run the Backend
```bash
cd "booking-service_1/booking-service"
mvn spring-boot:run
```
The server starts on `http://localhost:8080`.

---

### Step 4: Run the Frontend
```bash
cd "booking-frontend/booking-frontend"
npm install
npm run dev
```
The application will be live at `http://localhost:5173`.

---

## 🌐 Production Deployment Architecture

```
                       [ Users / Web Browsers ]
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │   Vercel / Cloudflare    │
                     │  (React + Vite Frontend) │
                     └────────────┬─────────────┘
                                  │ HTTPS / WSS
                                  ▼
                     ┌──────────────────────────┐
                     │   Render / Railway / EC2 │
                     │   (Spring Boot 3 Docker) │
                     └─────┬──────────────┬─────┘
                           │              │
        ┌──────────────────┘              └──────────────────┐
        ▼                                                    ▼
┌──────────────────────────┐                      ┌──────────────────────────┐
│  Aiven / Railway MySQL   │                      │  Upstash / Redis Cloud   │
│  (Persistent Database)   │                      │  (Managed Redis Cluster) │
└──────────────────────────┘                      └──────────────────────────┘
```

* **Frontend**: Hosted on [Vercel](https://vercel.com) with automatic Git deployments.
* **Backend**: Containerized with Docker and hosted on [Render](https://render.com) or [Railway](https://railway.app).
* **Managed Database**: [Aiven for MySQL](https://aiven.io) or Railway MySQL.
* **Managed Redis**: [Upstash Redis](https://upstash.com) (Serverless Redis with low-latency connection).

---

## 👨‍💻 Author

**Saksham Pathak**
* Major Project: High-Concurrency Ticket Booking Architecture
* Role: Full-Stack Engineer & System Architect
