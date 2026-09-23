package com.example.booking.dto;

import java.time.Instant;
import java.util.List;

public record HoldResponse(
        String holdId,
        List<Long> seatInventoryIds,
        Instant expiresAt
) {}
