package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "meal_plan_draft")
public class MealPlanDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    public Cliente cliente;

    @ManyToOne(optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    public Usuario author;

    @Column(nullable = false, length = 160)
    public String title = "";

    @Column(name = "plan_date")
    public LocalDate planDate;

    @Column(nullable = false, columnDefinition = "text")
    public String notes = "";

    @Column(nullable = false, columnDefinition = "text")
    public String payload = "{\"meals\":[]}";

    @Version
    @Column(nullable = false)
    public Long version;

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