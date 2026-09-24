package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class DiaRegistro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    public Cliente cliente;

    @Column(nullable = false)
    public LocalDate data;

    @Column(name = "peso_kg", precision = 6, scale = 2)
    public java.math.BigDecimal pesoKg;

    @Column(name = "agua_ml")
    public Integer aguaMl;
}
