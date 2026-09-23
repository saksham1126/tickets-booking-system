package com.example.booking.entity;

import com.example.booking.entity.enums.SeatStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * One row per (seat x showtime) - the actual bookable unit.
 * The `version` field is the JPA optimistic-lock column: Hibernate appends
 * "AND version = ?" to every UPDATE and bumps it by 1 on success. If a
 * concurrent transaction already changed the row, the affected-row-count
 * comes back 0 and Hibernate throws OptimisticLockException.
 */
@Entity
@Table(name = "seat_inventory", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_instance_id", "seat_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class SeatInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_instance_id", nullable = false)
    private EventInstance eventInstance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @Column(name = "price_cents", nullable = false)
    private Integer priceCents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatStatus status = SeatStatus.AVAILABLE;

    // denormalized pointer to the Redis hold owner - advisory only,
    // the DB transaction re-validates this at confirm time
    @Column(name = "held_by_session")
    private String heldBySession;

    @Column(name = "hold_expires_at")
    private Instant holdExpiresAt;

    @Version
    @Column(nullable = false)
    private Long version;
}
