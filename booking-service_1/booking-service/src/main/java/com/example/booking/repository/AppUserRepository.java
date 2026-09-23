package com.example.booking.repository;

import com.example.booking.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByMobileNumber(String mobileNumber);
    boolean existsByMobileNumber(String mobileNumber);
}
