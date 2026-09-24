package com.lucas.nutriwarrior.model.entity;

import com.lucas.nutriwarrior.model.FoodItem;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "item_refeicao")
public class ItemRefeicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "refeicao_id", nullable = false)
    public Refeicao refeicao;

    @ManyToOne(optional = false)
    @JoinColumn(name = "food_item_id", nullable = false)
    public FoodItem foodItem;

    @Column(nullable = false)
    public String alimento;

    @Column(
        name = "quantidade_gramas",
        precision = 10,
        scale = 2
    )
    public BigDecimal quantidadeGramas;

    @Column(
        precision = 10,
        scale = 2
    )
    public BigDecimal kcal;

    @Column(
        name = "carb_gramas",
        precision = 10,
        scale = 2
    )
    public BigDecimal carboidratosGramas;

    @Column(
        name = "prot_gramas",
        precision = 10,
        scale = 2
    )
    public BigDecimal proteinasGramas;

    @Column(
        name = "gord_gramas",
        precision = 10,
        scale = 2
    )
    public BigDecimal gordurasGramas;
}