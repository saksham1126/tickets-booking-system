# Manual API Walkthrough

Setup (MySQL):
```
mysql -u root -p -e "CREATE DATABASE booking_db; CREATE USER 'booking_user'@'localhost' IDENTIFIED BY 'booking_pass'; GRANT ALL PRIVILEGES ON booking_db.* TO 'booking_user'@'localhost'; FLUSH PRIVILEGES;"
mysql -u booking_user -p booking_db < src/main/resources/schema.sql
mysql -u booking_user -p booking_db < src/main/resources/seed.sql
```

Run these one at a time, in order, after the app is up and `seed.sql` has been applied.

## 1. Check the seat map
```bash
curl -s http://localhost:8080/api/events/1/seatmap | python3 -m json.tool
```
Expect 5 seats, all `"status": "AVAILABLE"`.

## 2. Place a hold on seat_inventory id 1
```bash
curl -s -X POST http://localhost:8080/api/holds \
  -H "Content-Type: application/json" \
  -d '{"eventInstanceId": 1, "seatIds": [1], "sessionId": "session-alice"}' \
  | python3 -m json.tool
```
Expect `201 Created` with a `holdId` and `expiresAt` ~5 minutes out.

Re-check the seat map — seat_inventory id 1 should now show `"status": "HELD"`.

## 3. Try to hold the SAME seat with a different session (should fail)
```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/api/holds \
  -H "Content-Type: application/json" \
  -d '{"eventInstanceId": 1, "seatIds": [1], "sessionId": "session-bob"}'
```
Expect `409 Conflict`, `"error": "SEAT_UNAVAILABLE"`. This is the Redis `SET NX` layer doing its job.

## 4. Confirm the booking as Alice (the session that actually holds it)
```bash
curl -s -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "eventInstanceId": 1,
    "seatInventoryIds": [1],
    "sessionId": "session-alice",
    "paymentMethodToken": "tok_test_123"
  }' | python3 -m json.tool
```
Expect `201 Created`, `"status": "CONFIRMED"`.

## 5. Confirm the seat is now permanently BOOKED
```bash
curl -s http://localhost:8080/api/events/1/seatmap | python3 -m json.tool
```
seat_inventory id 1 should now show `"status": "BOOKED"`.

## 6. Try to confirm the same seat again (should fail — hold is gone)
```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "eventInstanceId": 1,
    "seatInventoryIds": [1],
    "sessionId": "session-bob",
    "paymentMethodToken": "tok_test_456"
  }'
```
Expect `409 Conflict`, `"error": "HOLD_EXPIRED"` (seat status isn't HELD anymore, so `validateHold` rejects it before the DB write even happens).

If all 6 steps behave as described, both locking layers are working end-to-end.
