package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "meta_nutricional")
public class MetaNutricional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    public Cliente cliente;

    @Column(precision = 10, scale = 2)
    public BigDecimal calorias;

    @Column(name = "proteinas_gramas", precision = 10, scale = 2)
    public BigDecimal proteinasGramas;

    @Column(name = "carboidratos_gramas", precision = 10, scale = 2)
    public BigDecimal carboidratosGramas;

    @Column(name = "gorduras_gramas", precision = 10, scale = 2)
    public BigDecimal gordurasGramas;

    @Column(name = "agua_ml")
    public Integer aguaMl;
}