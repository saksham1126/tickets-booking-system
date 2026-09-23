package com.example.booking.controller;

import com.example.booking.dto.BookingRequest;
import com.example.booking.dto.BookingResponse;
import com.example.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> confirmBooking(@Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.confirmBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
