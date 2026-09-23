package com.example.booking.dto;

public record CreatePaymentOrderResponse(
    String orderId,
    Integer amountCents,
    String currency,
    String keyId
) {}
