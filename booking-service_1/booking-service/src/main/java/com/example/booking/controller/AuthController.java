package com.example.booking.controller;

import com.example.booking.dto.AuthResponse;
import com.example.booking.dto.LoginRequest;
import com.example.booking.dto.RegisterRequest;
import com.example.booking.entity.AppUser;
import com.example.booking.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin-login")
    public ResponseEntity<AuthResponse> adminLogin(@RequestBody Map<String, String> body) {
        String mobile = body.get("mobileNumber");
        String pin = body.get("pin");
        AuthResponse response = authService.adminLogin(mobile, pin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal AppUser user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AuthResponse response = authService.getProfile(user.getId());
        return ResponseEntity.ok(response);
    }

    // Catch auth-specific exceptions and return friendly JSON errors
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleAuthError(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "AUTH_ERROR", "message", ex.getMessage()));
    }
}
