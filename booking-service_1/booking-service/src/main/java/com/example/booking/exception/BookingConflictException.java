package com.example.booking.exception;

/** Thrown after retries are exhausted on OptimisticLockException - genuine contention. */
public class BookingConflictException extends RuntimeException {
    public BookingConflictException(String message) {
        super(message);
    }
}
