package com.example.booking.dto;

/**
 * Pushed over WebSocket to /topic/seatmap/{eventInstanceId} whenever a
 * seat's status changes. The React frontend's WebSocket onmessage handler
 * receives this and updates just that one seat in the UI - no re-fetch of
 * the whole seat map needed.
 */
public record SeatStatusUpdate(
        Long seatInventoryId,
        String status // "AVAILABLE" | "HELD" | "BOOKED"
) {}
