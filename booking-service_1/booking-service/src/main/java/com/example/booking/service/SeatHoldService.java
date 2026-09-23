package com.example.booking.service;

import com.example.booking.dto.HoldRequest;
import com.example.booking.dto.HoldResponse;
import com.example.booking.dto.SeatStatusUpdate;
import com.example.booking.entity.SeatInventory;
import com.example.booking.entity.enums.SeatStatus;
import com.example.booking.exception.SeatUnavailableException;
import com.example.booking.repository.SeatInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * LAYER 1 of the concurrency model: fast, advisory, TTL-based holds in Redis.
 *
 * Redisson's RBucket.trySet(value, ttl) issues the Redis equivalent of
 *   SET seat_hold:{eventInstanceId}:{seatId} {sessionId} NX EX 300
 * which is atomic - only one caller can ever win the SET for a given key.
 *
 * This layer is intentionally "soft": if Redis has a blip and a lock is
 * lost, the DB layer (BookingService, Layer 2) still enforces correctness
 * via @Version optimistic locking + the UNIQUE constraint. Redis existing
 * is purely to give users fast, cheap feedback and avoid needless DB writes
 * while people are just browsing/comparing seats.
 *
 * Every status change also gets pushed to WebSocket subscribers of
 * /topic/seatmap/{eventInstanceId}, so other users' browsers update live
 * without polling.
 */
@Service
@RequiredArgsConstructor
public class SeatHoldService {

    private static final Duration HOLD_TTL = Duration.ofMinutes(5);

    private final RedissonClient redissonClient;
    private final SeatInventoryRepository seatInventoryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public HoldResponse placeHold(HoldRequest request) {
        List<SeatInventory> lockedSeats = new ArrayList<>();
        List<String> acquiredKeys = new ArrayList<>();
        Instant expiresAt = Instant.now().plus(HOLD_TTL);

        try {
            for (Long seatId : request.seatIds()) {
                String redisKey = holdKey(request.eventInstanceId(), seatId);
                RBucket<String> bucket = redissonClient.getBucket(redisKey);

                // atomic SET NX EX - this is the actual race-condition guard
                boolean acquired = bucket.trySet(request.sessionId(), HOLD_TTL.toSeconds(), TimeUnit.SECONDS);
                if (!acquired) {
                    throw new SeatUnavailableException(
                            "Seat " + seatId + " is already held by another user");
                }
                acquiredKeys.add(redisKey);

                SeatInventory seat = seatInventoryRepository
                        .findByEventInstance_Id(request.eventInstanceId()).stream()
                        .filter(si -> si.getSeat().getId().equals(seatId))
                        .findFirst()
                        .orElseThrow(() -> new SeatUnavailableException("Seat " + seatId + " not found"));

                if (seat.getStatus() != SeatStatus.AVAILABLE) {
                    throw new SeatUnavailableException("Seat " + seatId + " is not available");
                }

                // denormalized write so the seat-map query / WebSocket
                // broadcast can show "HELD" without hitting Redis per read
                seat.setStatus(SeatStatus.HELD);
                seat.setHeldBySession(request.sessionId());
                seat.setHoldExpiresAt(expiresAt);
                lockedSeats.add(seat);
            }

            seatInventoryRepository.saveAll(lockedSeats);

            // push the update to every browser subscribed to this event's seat map
            for (SeatInventory seat : lockedSeats) {
                messagingTemplate.convertAndSend(
                        "/topic/seatmap/" + request.eventInstanceId(),
                        new SeatStatusUpdate(seat.getId(), SeatStatus.HELD.name()));
            }

            String holdId = UUID.randomUUID().toString();
            List<Long> seatInventoryIds = lockedSeats.stream().map(SeatInventory::getId).toList();
            return new HoldResponse(holdId, seatInventoryIds, expiresAt);

        } catch (RuntimeException ex) {
            // roll back any Redis keys we grabbed before the failure, so we
            // don't leak a 5-minute hold on seats the request as a whole failed for
            acquiredKeys.forEach(key -> redissonClient.getBucket(key).delete());
            throw ex;
        }
    }

    @Transactional
    public void releaseHold(Long eventInstanceId, Long seatId, String sessionId) {
        String redisKey = holdKey(eventInstanceId, seatId);
        RBucket<String> bucket = redissonClient.getBucket(redisKey);
        String currentHolder = bucket.get();
        if (!sessionId.equals(currentHolder)) {
            return; // not this session's hold to release - no-op
        }
        bucket.delete();

        SeatInventory seat = seatInventoryRepository.findByEventInstance_Id(eventInstanceId).stream()
                .filter(si -> si.getSeat().getId().equals(seatId))
                .findFirst()
                .orElse(null);
        if (seat != null && seat.getStatus() == SeatStatus.HELD) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setHeldBySession(null);
            seat.setHoldExpiresAt(null);
            seatInventoryRepository.save(seat);

            messagingTemplate.convertAndSend(
                    "/topic/seatmap/" + eventInstanceId,
                    new SeatStatusUpdate(seat.getId(), SeatStatus.AVAILABLE.name()));
        }
    }

    private String holdKey(Long eventInstanceId, Long seatId) {
        return "seat_hold:%d:%d".formatted(eventInstanceId, seatId);
    }
}
