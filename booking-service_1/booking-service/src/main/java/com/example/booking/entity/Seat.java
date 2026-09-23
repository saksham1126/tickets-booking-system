package com.example.booking.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "seat", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"venue_id", "section", "row_label", "seat_number"})
})
@Getter
@Setter
@NoArgsConstructor
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    private String section;

    @Column(name = "row_label")
    private String rowLabel;

    @Column(name = "seat_number")
    private String seatNumber;

    @Column(name = "seat_type")
    private String seatType; // REGULAR, PREMIUM, ACCESSIBLE
}
