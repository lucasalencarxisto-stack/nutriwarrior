package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;

import java.time.LocalTime;

@Entity
@Table(name = "refeicao")
public class Refeicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "dia_registro_id", nullable = false)
    public DiaRegistro diaRegistro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public TipoRefeicao tipo;

    public LocalTime horario;
}