package com.example.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyPaymentRequest(
    @NotBlank String razorpayOrderId,
    @NotBlank String razorpayPaymentId,
    @NotBlank String razorpaySignature
) {}
