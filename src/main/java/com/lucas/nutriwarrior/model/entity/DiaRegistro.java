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
}
