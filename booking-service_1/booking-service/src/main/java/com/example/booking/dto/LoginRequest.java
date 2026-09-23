package com.example.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String mobileNumber,
        @NotBlank String password
) {}
