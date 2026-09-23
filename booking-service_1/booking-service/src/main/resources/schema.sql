CREATE TABLE IF NOT EXISTS venue (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    city          VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_user (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) UNIQUE,
    name          VARCHAR(255),
    mobile_number VARCHAR(15) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seat (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    venue_id      BIGINT NOT NULL,
    section       VARCHAR(50),
    row_label     VARCHAR(10),
    seat_number   VARCHAR(10),
    seat_type     VARCHAR(20),
    UNIQUE KEY uq_seat_layout (venue_id, section, row_label, seat_number),
    CONSTRAINT fk_seat_venue FOREIGN KEY (venue_id) REFERENCES venue(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_instance (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    venue_id        BIGINT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    starts_at       DATETIME NOT NULL,
    ends_at         DATETIME,
    status          VARCHAR(20) DEFAULT 'ON_SALE',
    CONSTRAINT fk_event_venue FOREIGN KEY (venue_id) REFERENCES venue(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seat_inventory (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_instance_id BIGINT NOT NULL,
    seat_id           BIGINT NOT NULL,
    price_cents       INT NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    held_by_session   VARCHAR(100),
    hold_expires_at   DATETIME,
    version           BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_seat_inv (event_instance_id, seat_id),
    CONSTRAINT fk_inv_event FOREIGN KEY (event_instance_id) REFERENCES event_instance(id),
    CONSTRAINT fk_inv_seat FOREIGN KEY (seat_id) REFERENCES seat(id)
) ENGINE=InnoDB;
CREATE INDEX idx_seat_inv_status ON seat_inventory(event_instance_id, status);

CREATE TABLE IF NOT EXISTS booking (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    event_instance_id   BIGINT NOT NULL,
    status              VARCHAR(20) NOT NULL,
    total_amount_cents  INT NOT NULL,
    idempotency_key     VARCHAR(255) NOT NULL UNIQUE,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at        DATETIME,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES app_user(id),
    CONSTRAINT fk_booking_event FOREIGN KEY (event_instance_id) REFERENCES event_instance(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_seat (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id          BIGINT NOT NULL,
    seat_inventory_id   BIGINT NOT NULL UNIQUE,
    price_cents         INT NOT NULL,
    CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES booking(id),
    CONSTRAINT fk_bs_seat_inv FOREIGN KEY (seat_inventory_id) REFERENCES seat_inventory(id)
) ENGINE=InnoDB;
