package com.example.booking.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record HoldRequest(
        @NotNull Long eventInstanceId,
        @NotEmpty List<Long> seatIds,
        @NotNull String sessionId // e.g. from frontend's persisted browser/tab session id
) {}
