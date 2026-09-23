package com.example.booking.service;

import com.example.booking.config.JwtUtil;
import com.example.booking.dto.AuthResponse;
import com.example.booking.dto.LoginRequest;
import com.example.booking.dto.RegisterRequest;
import com.example.booking.entity.AppUser;
import com.example.booking.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Handles user registration, login, and profile retrieval.
 * Passwords are hashed with BCrypt before storage — the raw password
 * is never persisted or logged.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (appUserRepository.existsByMobileNumber(request.mobileNumber())) {
            throw new IllegalArgumentException("Mobile number already registered");
        }

        AppUser user = new AppUser();
        user.setName(request.name());
        user.setMobileNumber(request.mobileNumber());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = appUserRepository.save(user);

        String token = jwtUtil.generateToken(user.getId());
        return new AuthResponse(token, user.getId(), user.getName(), user.getMobileNumber(), user.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByMobileNumber(request.mobileNumber())
                .orElseThrow(() -> new IllegalArgumentException("Invalid mobile number or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid mobile number or password");
        }

        String token = jwtUtil.generateToken(user.getId());
        return new AuthResponse(token, user.getId(), user.getName(), user.getMobileNumber(), user.getRole());
    }

    public AuthResponse getProfile(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new AuthResponse(null, user.getId(), user.getName(), user.getMobileNumber(), user.getRole());
    }

    public AuthResponse adminLogin(String mobileNumber, String pin) {
        if (!"8602891120".equals(mobileNumber) || !"2005".equals(pin)) {
            throw new IllegalArgumentException("Invalid Owner credentials or PIN");
        }

        AppUser user = appUserRepository.findByMobileNumber(mobileNumber)
                .orElseGet(() -> {
                    AppUser newUser = new AppUser();
                    newUser.setName("Saksham Pathak");
                    newUser.setMobileNumber("8602891120");
                    newUser.setPasswordHash(passwordEncoder.encode("admin123"));
                    newUser.setRole("ADMIN");
                    return appUserRepository.save(newUser);
                });

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            user.setRole("ADMIN");
            user.setName("Saksham Pathak");
            appUserRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getId());
        return new AuthResponse(token, user.getId(), user.getName(), user.getMobileNumber(), user.getRole());
    }
}
