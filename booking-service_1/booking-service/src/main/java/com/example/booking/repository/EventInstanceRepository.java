package com.example.booking.repository;

import com.example.booking.entity.EventInstance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventInstanceRepository extends JpaRepository<EventInstance, Long> {
}
