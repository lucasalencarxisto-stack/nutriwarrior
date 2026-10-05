package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "appointment")
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "cliente_id", nullable = false) public Cliente cliente;
    @ManyToOne(optional = false) @JoinColumn(name = "nutricionista_id", nullable = false) public Usuario nutricionista;
    @Column(name = "starts_at", nullable = false) public Instant startsAt;
    @Column(nullable = false, length = 20) public String status;
    @Column(nullable = false, columnDefinition = "text") public String notes = "";
    @Column(name = "created_at", nullable = false, updatable = false) public Instant createdAt;
    @Column(name = "updated_at", nullable = false) public Instant updatedAt;

    @PrePersist void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate void onUpdate() {
        updatedAt = Instant.now();
    }
}
