package com.example.booking.repository;

import com.example.booking.entity.SeatInventory;
import com.example.booking.entity.enums.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;

public interface SeatInventoryRepository extends JpaRepository<SeatInventory, Long> {

    List<SeatInventory> findByEventInstance_Id(Long eventInstanceId);

    List<SeatInventory> findByEventInstance_IdAndStatus(Long eventInstanceId, SeatStatus status);

    // Used by the sweep job to reclaim seats whose Redis hold TTL already
    // expired but whose DB row never got flipped back (crash/network blip).
    List<SeatInventory> findByStatusAndHoldExpiresAtBefore(SeatStatus status, Instant cutoff);

    // Optional: pessimistic read lock available for admin/reconciliation
    // tools that need a hard lock instead of optimistic retry - NOT used
    // on the hot booking path, which relies on @Version instead.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SeatInventory s where s.id = :id")
    SeatInventory findByIdForUpdate(@Param("id") Long id);
}
