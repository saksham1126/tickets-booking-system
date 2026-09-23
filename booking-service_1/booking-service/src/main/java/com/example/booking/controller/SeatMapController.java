package com.example.booking.controller;

import com.example.booking.config.JwtUtil;
import com.example.booking.dto.SeatStatusUpdate;
import com.example.booking.entity.AppUser;
import com.example.booking.entity.SeatInventory;
import com.example.booking.entity.enums.SeatStatus;
import com.example.booking.repository.AppUserRepository;
import com.example.booking.repository.BookingRepository;
import com.example.booking.repository.BookingSeatRepository;
import com.example.booking.repository.SeatInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Slf4j
public class SeatMapController {

    private final SeatInventoryRepository seatInventoryRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final BookingRepository bookingRepository;
    private final RedissonClient redissonClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtUtil jwtUtil;
    private final AppUserRepository appUserRepository;

    private static final String OWNER_PIN = "2005";
    private static final String OWNER_PHONE = "8602891120";

    @GetMapping("/{eventInstanceId}/seatmap")
    public List<Map<String, Object>> getSeatMap(@PathVariable Long eventInstanceId) {
        List<SeatInventory> seats = seatInventoryRepository.findByEventInstance_Id(eventInstanceId);
        return seats.stream().map(si -> Map.<String, Object>of(
                "seatInventoryId", si.getId(),
                "section", si.getSeat().getSection(),
                "row", si.getSeat().getRowLabel(),
                "seatNumber", si.getSeat().getSeatNumber(),
                "status", si.getStatus(),
                "priceCents", si.getPriceCents(),
                "category", si.getSeat().getSeatType()
        )).toList();
    }

    /**
     * OWNER ONLY: Resets all seats for an event to AVAILABLE, flushes test bookings,
     * evicts Redis hold keys, and broadcasts live WebSocket updates.
     */
    @PostMapping("/{eventInstanceId}/reset")
    @Transactional
    public ResponseEntity<?> resetAllSeats(
            @PathVariable Long eventInstanceId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Owner-PIN", required = false) String ownerPin
    ) {
        boolean isAuthorized = false;

        // 1. Authorize via Owner PIN (2005)
        if (OWNER_PIN.equals(ownerPin)) {
            isAuthorized = true;
        }

        // 2. Authorize via Owner / Admin JWT Token
        if (!isAuthorized && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Long userId = jwtUtil.validateAndGetUserId(token);
                AppUser user = appUserRepository.findById(userId).orElse(null);
                if (user != null && ("ADMIN".equalsIgnoreCase(user.getRole()) || OWNER_PHONE.equals(user.getMobileNumber()))) {
                    isAuthorized = true;
                }
            } catch (Exception ex) {
                log.warn("Invalid token in reset request: {}", ex.getMessage());
            }
        }

        if (!isAuthorized) {
            log.warn("Unauthorized attempt to reset seat inventory for event: {}", eventInstanceId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "FORBIDDEN",
                    "message", "Unauthorized: Owner access required (Saksham Pathak / PIN 2005)"
            ));
        }

        log.info("Owner reset initiated for event: {}", eventInstanceId);

        // A. Clear test booking line items & headers
        bookingSeatRepository.deleteAll();
        bookingRepository.deleteAll();

        // B. Reset all seats for this event to AVAILABLE
        List<SeatInventory> seats = seatInventoryRepository.findByEventInstance_Id(eventInstanceId);
        for (SeatInventory seat : seats) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setHeldBySession(null);
            seat.setHoldExpiresAt(null);
        }
        seatInventoryRepository.saveAll(seats);

        // C. Evict Redis hold keys matching seat_hold:{eventInstanceId}:*
        try {
            redissonClient.getKeys().deleteByPattern("seat_hold:" + eventInstanceId + ":*");
        } catch (Exception ex) {
            log.warn("Failed to delete Redis hold keys pattern: {}", ex.getMessage());
        }

        // D. Push live WebSocket updates to all connected browser clients
        for (SeatInventory seat : seats) {
            try {
                messagingTemplate.convertAndSend(
                        "/topic/seatmap/" + eventInstanceId,
                        new SeatStatusUpdate(seat.getId(), SeatStatus.AVAILABLE.name())
                );
            } catch (Exception ex) {
                log.warn("WebSocket push failed for seat {}: {}", seat.getId(), ex.getMessage());
            }
        }

        log.info("Successfully reset {} seats to AVAILABLE for event {}", seats.size(), eventInstanceId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All seats successfully reset to AVAILABLE by Owner (Saksham Pathak)",
                "seatsReset", seats.size()
        ));
    }
}
