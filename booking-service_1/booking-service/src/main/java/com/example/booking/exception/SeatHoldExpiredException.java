package com.example.booking.exception;

/** Thrown at confirm-time if the hold has expired or doesn't belong to this session. */
public class SeatHoldExpiredException extends RuntimeException {
    public SeatHoldExpiredException(String message) {
        super(message);
    }
}
