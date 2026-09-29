package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

@Entity
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @NotBlank
    public String nome;

    public Double pesoAtualKg;

    @Column(name = "altura_cm")
    public Double alturaCm;

    @Column(name = "data_nascimento")
    public LocalDate dataNascimento;

    @OneToOne
    @JoinColumn(name = "usuario_id")
    public Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "nutricionista_id")
    public Usuario nutricionista;
}
