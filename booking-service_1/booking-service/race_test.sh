#!/bin/bash
# race_test.sh
#
# Fires N simultaneous POST /api/holds requests for the SAME seat, from
# different sessions, and checks that exactly one succeeds. This is the
# actual proof that the Redis SET NX layer prevents double-booking under
# real concurrency, not just in sequential curl calls.
#
# Usage: ./race_test.sh
# Requires: the app running on :8080, seed.sql already applied,
# and seat_inventory id 2 currently AVAILABLE (re-run seed.sql to reset).

SEAT_INVENTORY_ID=2
SEAT_ID=2               # the underlying seat.id for seat_inventory id 2
EVENT_INSTANCE_ID=1
CONCURRENT_REQUESTS=10
URL="http://localhost:8080/api/holds"

echo "Firing $CONCURRENT_REQUESTS simultaneous hold requests for seat_id=$SEAT_ID ..."
echo ""

results_dir=$(mktemp -d)

for i in $(seq 1 "$CONCURRENT_REQUESTS"); do
  (
    http_code=$(curl -s -o "$results_dir/body_$i.json" -w "%{http_code}" \
      -X POST "$URL" \
      -H "Content-Type: application/json" \
      -d "{\"eventInstanceId\": $EVENT_INSTANCE_ID, \"seatIds\": [$SEAT_ID], \"sessionId\": \"race-session-$i\"}")
    echo "$http_code" > "$results_dir/code_$i.txt"
  ) &
done

wait

success_count=0
conflict_count=0

for i in $(seq 1 "$CONCURRENT_REQUESTS"); do
  code=$(cat "$results_dir/code_$i.txt")
  if [ "$code" == "201" ]; then
    success_count=$((success_count + 1))
    echo "  session-$i -> 201 Created (WON the hold)"
  elif [ "$code" == "409" ]; then
    conflict_count=$((conflict_count + 1))
  else
    echo "  session-$i -> unexpected HTTP $code"
  fi
done

echo ""
echo "Results: $success_count succeeded, $conflict_count rejected with 409, out of $CONCURRENT_REQUESTS."

if [ "$success_count" -eq 1 ]; then
  echo "PASS: exactly one request won the hold, as expected."
else
  echo "FAIL: expected exactly 1 winner, got $success_count. Investigate the Redis SET NX logic."
fi

rm -rf "$results_dir"
