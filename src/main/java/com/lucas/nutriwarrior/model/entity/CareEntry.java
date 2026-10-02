package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "care_entry")
public class CareEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "cliente_id") public Cliente cliente;
    @ManyToOne(optional = false) @JoinColumn(name = "author_id") public Usuario author;
    @Column(name = "author_name", nullable = false) public String authorName;
    @Column(name = "request_id", nullable = false, length = 36) public String requestId;
    @Column(nullable = false, length = 20) public String kind;
    @Column(name = "entry_date", nullable = false) public LocalDate entryDate;
    @Column(name = "return_date") public LocalDate returnDate;
    @Column(nullable = false, length = 160) public String title;
    @Column(nullable = false, columnDefinition = "text") public String notes;
    @Column(nullable = false, columnDefinition = "text") public String anamnesis;
    @Column(nullable = false, columnDefinition = "text") public String payload;
    @Column(name = "version_number", nullable = false) public int version;
    @Column(name = "created_at", nullable = false) public Instant createdAt;
}
