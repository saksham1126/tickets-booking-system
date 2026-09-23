package com.example.booking.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

/**
 * The UNIQUE constraint on seat_inventory_id is the final backstop:
 * even if the Redis hold logic and the JPA optimistic-lock check both had
 * a bug, this constraint makes it physically impossible for two Booking
 * rows to ever reference the same SeatInventory row. The second INSERT
 * fails with a DataIntegrityViolationException.
 */
@Entity
@Table(name = "booking_seat", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"seat_inventory_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class BookingSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_inventory_id", nullable = false, unique = true)
    private SeatInventory seatInventory;

    @Column(name = "price_cents", nullable = false)
    private Integer priceCents;
}
