package com.example.booking.exception;

/** Thrown when the Redis SET NX fails - someone else already holds the seat. */
public class SeatUnavailableException extends RuntimeException {
    public SeatUnavailableException(String message) {
        super(message);
    }
}
