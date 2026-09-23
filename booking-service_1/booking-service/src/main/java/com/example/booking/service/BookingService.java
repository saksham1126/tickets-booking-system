package com.example.booking.service;

import com.example.booking.dto.BookingRequest;
import com.example.booking.dto.BookingResponse;
import com.example.booking.dto.SeatStatusUpdate;
import com.example.booking.entity.*;
import com.example.booking.entity.enums.BookingStatus;
import com.example.booking.entity.enums.SeatStatus;
import com.example.booking.exception.BookingConflictException;
import com.example.booking.exception.SeatHoldExpiredException;
import com.example.booking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * LAYER 2 of the concurrency model: the durable, ACID guarantee.
 *
 * confirmBooking() is where HELD -> BOOKED actually happens. It runs inside
 * a single @Transactional method, and SeatInventory.version (mapped with
 * @Version) means the UPDATE Hibernate issues is effectively:
 *
 *   UPDATE seat_inventory SET status = 'BOOKED', version = version + 1
 *   WHERE id = ? AND version = ?
 *
 * If a concurrent transaction already touched this row (bumped its version),
 * this UPDATE affects 0 rows and Hibernate raises OptimisticLockException.
 * Spring translates that to OptimisticLockingFailureException, which we
 * retry a few times (real contention is rare and usually resolves on retry
 * once the loser's stale read is refreshed) before giving up with a 409.
 *
 * Even if this logic had a bug, BookingSeat.seatInventoryId has a UNIQUE
 * DB constraint - the second INSERT would fail outright.
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final SeatInventoryRepository seatInventoryRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final AppUserRepository appUserRepository;
    private final EventInstanceRepository eventInstanceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Retryable(
            retryFor = OptimisticLockingFailureException.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 100, multiplier = 2) // 100ms, 200ms
    )
    @Transactional
    public BookingResponse confirmBooking(BookingRequest request) {

        // idempotency: if this exact request already produced a booking
        // (client retried a request that actually succeeded), return it
        // instead of double-charging / double-booking.
        String idempotencyKey = buildIdempotencyKey(request);
        var existing = bookingRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            Booking b = existing.get();
            return new BookingResponse(b.getId(), b.getStatus(), b.getTotalAmountCents());
        }

        AppUser user = appUserRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        EventInstance eventInstance = eventInstanceRepository.findById(request.eventInstanceId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        List<SeatInventory> seats = seatInventoryRepository.findAllById(request.seatInventoryIds());

        int totalCents = 0;
        for (SeatInventory seat : seats) {
            validateHold(seat, request.sessionId());
            totalCents += seat.getPriceCents();
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setEventInstance(eventInstance);
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setTotalAmountCents(totalCents);
        booking.setIdempotencyKey(idempotencyKey);
        booking = bookingRepository.save(booking);

        // ---- Payment would be charged here, outside seat-lock contention ----
        // In a real system this calls out to a Payment Service. If it fails,
        // we throw before flipping seats to BOOKED and the caller/Kafka
        // consumer releases the hold (see HoldExpiryCleanupJob for the
        // TTL-based fallback path).
        boolean paymentSucceeded = true; // placeholder for PaymentClient.charge(...)
        if (!paymentSucceeded) {
            throw new BookingConflictException("Payment failed");
        }

        for (SeatInventory seat : seats) {
            // This is the line that actually triggers the optimistic-lock
            // check: Hibernate's UPDATE includes "AND version = :loadedVersion".
            seat.setStatus(SeatStatus.BOOKED);
            seat.setHeldBySession(null);
            seat.setHoldExpiresAt(null);
            seatInventoryRepository.save(seat);

            BookingSeat bookingSeat = new BookingSeat();
            bookingSeat.setBooking(booking);
            bookingSeat.setSeatInventory(seat);
            bookingSeat.setPriceCents(seat.getPriceCents());
            bookingSeatRepository.save(bookingSeat); // UNIQUE constraint is the final backstop here

            messagingTemplate.convertAndSend(
                    "/topic/seatmap/" + request.eventInstanceId(),
                    new SeatStatusUpdate(seat.getId(), SeatStatus.BOOKED.name()));
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(Instant.now());
        bookingRepository.save(booking);

        // In production: publish Kafka "booking.confirmed" event here for
        // notification/analytics/fraud-feedback consumers, rather than
        // doing that work inline in this transaction.

        return new BookingResponse(booking.getId(), booking.getStatus(), booking.getTotalAmountCents());
    }

    // Called by Spring Retry after maxAttempts is exhausted - genuine,
    // sustained contention rather than a transient race.
    public BookingResponse recover(OptimisticLockingFailureException ex, BookingRequest request) {
        throw new BookingConflictException(
                "Could not confirm booking due to concurrent updates - please try again");
    }

    private void validateHold(SeatInventory seat, String sessionId) {
        if (seat.getStatus() != SeatStatus.HELD) {
            throw new SeatHoldExpiredException("Seat " + seat.getId() + " is not currently held");
        }
        if (!sessionId.equals(seat.getHeldBySession())) {
            throw new SeatHoldExpiredException("Seat " + seat.getId() + " is held by a different session");
        }
        if (seat.getHoldExpiresAt() == null || seat.getHoldExpiresAt().isBefore(Instant.now())) {
            throw new SeatHoldExpiredException("Hold on seat " + seat.getId() + " has expired");
        }
    }

    private String buildIdempotencyKey(BookingRequest request) {
        // In production this is a client-generated UUID sent as a header.
        // Deriving it here is a simplified stand-in for that flow.
        return request.sessionId() + ":" + request.eventInstanceId() + ":" + request.seatInventoryIds();
    }
}
