package com.example.booking.scheduled;

import com.example.booking.dto.SeatStatusUpdate;
import com.example.booking.entity.SeatInventory;
import com.example.booking.entity.enums.SeatStatus;
import com.example.booking.repository.SeatInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Redis TTL handles hold expiry automatically in the common case. This job
 * is the fallback for the uncommon case: the app crashed or a network
 * partition happened between the Redis SET and the DB write, or Redis and
 * the database briefly disagreed. Runs every 30s and reclaims any seat
 * still marked HELD past its hold_expires_at, broadcasting the reset to
 * any browser still watching that seat map.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HoldExpiryCleanupJob {

    private final SeatInventoryRepository seatInventoryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void reclaimExpiredHolds() {
        List<SeatInventory> expired = seatInventoryRepository
                .findByStatusAndHoldExpiresAtBefore(SeatStatus.HELD, Instant.now());

        if (expired.isEmpty()) {
            return;
        }

        for (SeatInventory seat : expired) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setHeldBySession(null);
            seat.setHoldExpiresAt(null);
        }
        seatInventoryRepository.saveAll(expired);

        for (SeatInventory seat : expired) {
            messagingTemplate.convertAndSend(
                    "/topic/seatmap/" + seat.getEventInstance().getId(),
                    new SeatStatusUpdate(seat.getId(), SeatStatus.AVAILABLE.name()));
        }

        log.info("Reclaimed {} expired seat holds", expired.size());
    }
}

