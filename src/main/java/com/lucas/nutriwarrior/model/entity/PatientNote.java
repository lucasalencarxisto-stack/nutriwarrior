package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patient_note")
public class PatientNote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "cliente_id", nullable = false) public Cliente cliente;
    @ManyToOne(optional = false) @JoinColumn(name = "author_id", nullable = false) public Usuario author;
    @Column(nullable = false, columnDefinition = "text") public String content;
    @Column(name = "created_at", nullable = false, updatable = false) public Instant createdAt;

    @PrePersist void onCreate() {
        createdAt = Instant.now();
    }
}
