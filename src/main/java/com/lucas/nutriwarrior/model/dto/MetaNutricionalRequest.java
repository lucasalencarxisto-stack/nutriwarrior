package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public class MetaNutricionalRequest {
    @Positive(message = "Meta de calorias deve ser maior que zero")
    public BigDecimal calorias;
    @Positive(message = "Meta de proteinas deve ser maior que zero")
    public BigDecimal proteinasGramas;
    @Positive(message = "Meta de carboidratos deve ser maior que zero")
    public BigDecimal carboidratosGramas;
    @Positive(message = "Meta de gorduras deve ser maior que zero")
    public BigDecimal gordurasGramas;
    @PositiveOrZero(message = "Meta de agua nao pode ser negativa")
    public Integer aguaMl;
}