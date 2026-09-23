package com.example.booking.controller;

import com.example.booking.dto.HoldRequest;
import com.example.booking.dto.HoldResponse;
import com.example.booking.service.SeatHoldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/holds")
@RequiredArgsConstructor
public class HoldController {

    private final SeatHoldService seatHoldService;

    @PostMapping
    public ResponseEntity<HoldResponse> placeHold(@Valid @RequestBody HoldRequest request) {
        HoldResponse response = seatHoldService.placeHold(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping
    public ResponseEntity<Void> releaseHold(
            @RequestParam Long eventInstanceId,
            @RequestParam Long seatId,
            @RequestParam String sessionId) {
        seatHoldService.releaseHold(eventInstanceId, seatId, sessionId);
        return ResponseEntity.noContent().build();
    }
}
