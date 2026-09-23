package com.example.booking.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(SeatUnavailableException.class)
    public ResponseEntity<Map<String, String>> handleSeatUnavailable(SeatUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "SEAT_UNAVAILABLE", "message", ex.getMessage()));
    }

    @ExceptionHandler(SeatHoldExpiredException.class)
    public ResponseEntity<Map<String, String>> handleHoldExpired(SeatHoldExpiredException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "HOLD_EXPIRED", "message", ex.getMessage()));
    }

    @ExceptionHandler(BookingConflictException.class)
    public ResponseEntity<Map<String, String>> handleBookingConflict(BookingConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "BOOKING_CONFLICT", "message", ex.getMessage()));
    }

    // Safety net if the UNIQUE constraint on booking_seat.seat_inventory_id
    // is ever what actually catches a double-booking attempt.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "SEAT_ALREADY_BOOKED", "message", "This seat was just booked by someone else."));
    }
}
