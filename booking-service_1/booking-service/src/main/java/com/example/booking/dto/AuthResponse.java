package com.example.booking.dto;

public record AuthResponse(
        String token,
        Long userId,
        String name,
        String mobileNumber,
        String role
) {}
