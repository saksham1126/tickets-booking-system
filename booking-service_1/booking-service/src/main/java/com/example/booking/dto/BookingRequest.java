package com.example.booking.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BookingRequest(
        @NotNull Long userId,
        @NotNull Long eventInstanceId,
        @NotEmpty List<Long> seatInventoryIds,
        @NotNull String sessionId,      // must match the session that placed the hold
        @NotNull String paymentMethodToken
) {}
