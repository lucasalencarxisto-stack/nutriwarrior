package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;

public class DiaRegistroRequest {

    @NotNull(message = "Data e obrigatoria")
    public LocalDate data;

    @Positive(message = "Peso deve ser maior que zero")
    public BigDecimal pesoKg;

    @PositiveOrZero(message = "Agua nao pode ser negativa")
    public Integer aguaMl;
}