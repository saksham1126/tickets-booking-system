package com.example.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Size(min = 10, max = 10, message = "Mobile number must be 10 digits")
        String mobileNumber,
        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
        String password
) {}
