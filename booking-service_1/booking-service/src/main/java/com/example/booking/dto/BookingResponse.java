package com.example.booking.dto;

import com.example.booking.entity.enums.BookingStatus;

public record BookingResponse(
        Long bookingId,
        BookingStatus status,
        Integer totalAmountCents
) {}
