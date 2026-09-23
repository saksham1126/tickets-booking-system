package com.example.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreatePaymentOrderRequest(
    @NotNull @Positive Integer amountCents,
    String currency
) {}
