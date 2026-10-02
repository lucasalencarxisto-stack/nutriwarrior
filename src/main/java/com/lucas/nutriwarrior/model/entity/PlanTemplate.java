package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "plan_template")
public class PlanTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    public Usuario author;

    @Column(nullable = false, length = 120)
    public String name;

    @Column(nullable = false, length = 160)
    public String title;

    @Column(nullable = false, columnDefinition = "text")
    public String notes = "";

    @Column(nullable = false, columnDefinition = "text")
    public String payload;

    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
