package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class ItemRefeicaoRequest {

    @NotNull(message = "Alimento e obrigatorio")
    public Long foodItemId;

    @NotNull(message = "Quantidade e obrigatoria")
    @Positive(message = "Quantidade deve ser maior que zero")
    public BigDecimal quantidadeGramas;
}