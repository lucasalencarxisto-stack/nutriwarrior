package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class FoodItemRequest {

    @NotBlank(message = "Nome do alimento e obrigatorio")
    public String name;

    @NotNull(message = "Calorias sao obrigatorias")
    @PositiveOrZero(message = "Calorias nao podem ser negativas")
    public Double calories;

    @NotNull(message = "Proteina e obrigatoria")
    @PositiveOrZero(message = "Proteina nao pode ser negativa")
    public Double protein;

    @NotNull(message = "Carboidratos sao obrigatorios")
    @PositiveOrZero(message = "Carboidratos nao podem ser negativos")
    public Double carbs;

    @NotNull(message = "Gordura e obrigatoria")
    @PositiveOrZero(message = "Gordura nao pode ser negativa")
    public Double fat;
}